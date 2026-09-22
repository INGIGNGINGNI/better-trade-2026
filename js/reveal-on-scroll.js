(() => {
    const revealSelector = [
        '.bt-section-title',
        '.bt-section-subtext',
        '.concept__description',
        '.topics-showcase__header p',
        '.ticket__plan',
        '.ticket__formats',
        '.ticket__benefits h3',
        '.ticket__benefits-list li',
        '.playbook__header h2',
        '.playbook__header p',
        '.playbook__step',
        '.playbook__action',
        '[data-reveal]',
    ].join(', ');
    const targets = Array.from(document.querySelectorAll(revealSelector));
    if (!targets.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
        targets.forEach(target => target.classList.add('is-revealed'));
        return;
    }

    document.body.classList.add('reveal-on-scroll-ready');

    const revealTarget = (entry, activeObserver) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-revealed');
        activeObserver.unobserve(entry.target);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            revealTarget(entry, observer);
        });
    }, {
        /* threshold ต้องเป็น 0 ไม่ใช่สัดส่วนของตัว element
           เดิมใช้ 0.18 ซึ่งแปลว่า "ต้องเห็น 18% ของตัวมันเอง" ของยิ่งสูงยิ่งต้องเลื่อนนาน
           การ์ดสูง 600px ต้องเลื่อนเข้ามาเกือบ 200px กว่าจะเริ่มเล่น ระหว่างนั้นเห็นเป็นที่ว่าง
           เปลี่ยนเป็น 0 แล้วคุมจังหวะด้วย rootMargin แทน ทุก element จึงเริ่มพร้อมกัน
           ไม่ว่าจะสูงเท่าไหร่

           rootMargin ล่างเป็นบวก = ขยายขอบล่างของจอลงไปอีก 5% เริ่มเล่นตั้งแต่ยังไม่ทันโผล่
           ชดเชยกับที่ element ถูกดันลงไป --reveal-y (80px) ตอนเลื่อนถึงจริงจึงกำลังลอยขึ้นพอดี
           ไม่ใช่เพิ่งเริ่มนับหนึ่ง */
        threshold: 0,
        rootMargin: '0px 0px 5% 0px',
    });

    targets.forEach((target) => {
        if (!target.hasAttribute('data-reveal')) {
            target.setAttribute('data-reveal', 'fade-up');
        }

        const delay = target.getAttribute('data-reveal-delay');
        if (delay) {
            target.style.setProperty('--reveal-delay', /^\d+$/.test(delay) ? `${delay}ms` : delay);
        } else if (target.classList.contains('bt-section-subtext')) {
            target.style.setProperty('--reveal-delay', '120ms');
        } else if (target.classList.contains('concept__description') || target.matches('.topics-showcase__header p')) {
            target.style.setProperty('--reveal-delay', '160ms');
        } else if (target.matches('.playbook__header p')) {
            target.style.setProperty('--reveal-delay', '160ms');
        }

        if (target.classList.contains('playbook__action')) {
            target.setAttribute('data-reveal', 'fade');
            target.style.setProperty('--reveal-y', '0px');
        }

        observer.observe(target);
    });

    const setDelay = (selector, callback) => {
        document.querySelectorAll(selector).forEach((target, index) => {
            if (target.hasAttribute('data-reveal-delay')) return;
            target.style.setProperty('--reveal-delay', `${callback(target, index)}ms`);
        });
    };

    setDelay('.ticket__plan', (target) => {
        if (target.classList.contains('ticket__plan--explorer')) return 0;
        if (target.classList.contains('ticket__plan--ultimate')) return 120;
        if (target.classList.contains('ticket__plan--master')) return 240;
        return 120;
    });

    setDelay('.ticket__benefits h3', () => 0);
    setDelay('.ticket__benefits-list li', (_, index) => 100 + index * 80);
    setDelay('.playbook__step', (_, index) => index * 120);
    setDelay('.playbook__action', () => 300);
})();
