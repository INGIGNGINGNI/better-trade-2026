(() => {
    const countdown = document.getElementById('event-countdown');
    if (!countdown) return;

    const startsAt = Date.parse('2026-10-31T09:00:00+07:00');
    const endsAt = Date.parse('2026-11-01T18:30:00+07:00');
    const values = countdown.querySelector('.event-countdown__values');
    const status = countdown.querySelector('.event-countdown__status');
    const fields = Object.fromEntries(
        [...countdown.querySelectorAll('[data-countdown]')]
            .map(node => [node.dataset.countdown, node])
    );

    const pad = value => String(value).padStart(2, '0');

    const showStatus = message => {
        countdown.classList.add('is-status');
        status.textContent = message;
        countdown.setAttribute('aria-label', message);
    };

    const update = () => {
        const now = Date.now();

        if (now >= endsAt) {
            showStatus('ขอบคุณที่มาร่วมงาน Better Trade 2026');
            return false;
        }

        if (now >= startsAt) {
            showStatus('งานกำลังดำเนินอยู่');
            return true;
        }

        countdown.classList.remove('is-status');
        status.textContent = '';
        values.removeAttribute('aria-hidden');

        let remaining = startsAt - now;
        const days = Math.floor(remaining / 86400000);
        remaining %= 86400000;
        const hours = Math.floor(remaining / 3600000);
        remaining %= 3600000;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        fields.days.textContent = pad(days);
        fields.hours.textContent = pad(hours);
        fields.minutes.textContent = pad(minutes);
        fields.seconds.textContent = pad(seconds);
        countdown.setAttribute(
            'aria-label',
            `เริ่มงานใน ${days} วัน ${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`
        );
        return true;
    };

    let timer = null;
    const tick = () => {
        if (!update() && timer) {
            window.clearInterval(timer);
            timer = null;
        }
    };

    tick();
    if (Date.now() < endsAt) timer = window.setInterval(tick, 1000);
})();
