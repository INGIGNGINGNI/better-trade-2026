(() => {
    const countdown = document.getElementById('event-countdown');
    if (!countdown) return;

    /* นับถึงหมดเขตราคา Early Bird สิ้นวันที่ 30 กันยายน 2569 (ค.ศ. 2026) ตรงกับข้อความบนกล่อง
       ไม่ใช่วันเริ่มงาน เพราะตัวนับนี้อยู่ในกล่องข้อเสนอ Early Bird เท่านั้น */
    const endsAt = Date.parse('2026-10-01T00:00:00+07:00');
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
            showStatus('หมดเขตราคา Early Bird แล้ว');
            return false;
        }

        countdown.classList.remove('is-status');
        status.textContent = '';
        values.removeAttribute('aria-hidden');

        let remaining = endsAt - now;
        const days = Math.floor(remaining / 86400000);
        remaining %= 86400000;
        const hours = Math.floor(remaining / 3600000);
        remaining %= 3600000;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        if (fields.days) fields.days.textContent = pad(days);
        if (fields.hours) fields.hours.textContent = pad(hours);
        if (fields.minutes) fields.minutes.textContent = pad(minutes);
        if (fields.seconds) fields.seconds.textContent = pad(seconds);
        countdown.setAttribute('aria-label', fields.seconds
            ? `เหลือเวลาซื้อบัตรราคา Early Bird อีก ${days} วัน ${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`
            : `เหลือเวลาซื้อบัตรราคา Early Bird อีก ${days} วัน ${hours} ชั่วโมง ${minutes} นาที`);
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
