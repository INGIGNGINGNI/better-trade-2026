(() => {
    const groups = document.querySelectorAll('.ticket__prices[role="radiogroup"]');
    const ticket = document.querySelector('.ticket');

    const equalizeTicketPriceHeights = () => {
        if (!ticket) return;

        ticket.style.removeProperty('--bt-ticket-price-equal-height');

        const selectableOptions = Array.from(
            ticket.querySelectorAll('.ticket__price[data-ticket-option]:not(:disabled):not([aria-disabled="true"])')
        );

        if (!selectableOptions.length) return;

        const maxHeight = Math.ceil(Math.max(
            ...selectableOptions.map((option) => option.getBoundingClientRect().height)
        ));

        if (maxHeight > 0) {
            ticket.style.setProperty('--bt-ticket-price-equal-height', `${maxHeight}px`);
        }
    };

    let equalizeFrame = 0;

    const scheduleTicketPriceEqualize = () => {
        if (equalizeFrame) window.cancelAnimationFrame(equalizeFrame);
        equalizeFrame = window.requestAnimationFrame(() => {
            equalizeFrame = 0;
            equalizeTicketPriceHeights();
        });
    };

    groups.forEach((group) => {
        const options = Array.from(group.querySelectorAll('[data-ticket-option]'));
        const plan = group.closest('.ticket__plan');
        const action = plan?.querySelector('[data-ticket-action]');

        const selectOption = (selectedOption, shouldFocus = false) => {
            options.forEach((option) => {
                const isSelected = option === selectedOption;
                option.classList.toggle('is-active', isSelected);
                option.setAttribute('aria-checked', String(isSelected));
                option.tabIndex = isSelected ? 0 : -1;
            });

            if (action && selectedOption.dataset.ticketLabel) {
                action.textContent = selectedOption.dataset.ticketLabel;
            }

            if (shouldFocus) selectedOption.focus();
        };

        options.forEach((option, index) => {
            option.addEventListener('click', () => selectOption(option));
            option.addEventListener('keydown', (event) => {
                let nextIndex = null;

                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (index + 1) % options.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (index - 1 + options.length) % options.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = options.length - 1;
                }

                if (nextIndex === null) return;
                event.preventDefault();
                selectOption(options[nextIndex], true);
            });
        });

        const initialOption = options.find((option) => option.classList.contains('is-active'));
        if (initialOption) selectOption(initialOption);
    });

    scheduleTicketPriceEqualize();
    window.addEventListener('resize', scheduleTicketPriceEqualize, { passive: true });
    document.fonts?.ready?.then(scheduleTicketPriceEqualize);
})();
