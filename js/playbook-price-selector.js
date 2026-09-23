/* ตัวเลือกราคาบัตรใน section Ticket ของหน้า personalized-playbook.html
   ผูกกับ data attribute ของหน้านี้เท่านั้น ไม่อ้างอิง class ของ section ใดในหน้าอื่น */
(() => {
    const group = document.querySelector('[data-playbook-price-group]');
    if (!group) return;

    const options = [...group.querySelectorAll('[data-playbook-price]')];
    if (!options.length) return;

    const action = document.querySelector('[data-playbook-price-action]');

    const select = (option, shouldFocus = false) => {
        options.forEach(item => {
            const isSelected = item === option;
            item.classList.toggle('is-active', isSelected);
            item.setAttribute('aria-checked', String(isSelected));
            item.tabIndex = isSelected ? 0 : -1;
        });

        if (action && option.dataset.playbookPriceLabel) {
            action.textContent = option.dataset.playbookPriceLabel;
        }

        if (shouldFocus) option.focus();
    };

    /* radiogroup เดินด้วยลูกศรตามมาตรฐาน ไม่ใช่ปุ่ม Tab ทีละใบ */
    const STEP_BY_KEY = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
    };

    options.forEach((option, index) => {
        option.addEventListener('click', () => select(option));
        option.addEventListener('keydown', event => {
            const step = STEP_BY_KEY[event.key];
            if (!step) return;

            event.preventDefault();
            select(options[(index + step + options.length) % options.length], true);
        });
    });

    select(options.find(option => option.classList.contains('is-active')) || options[0]);
})();
