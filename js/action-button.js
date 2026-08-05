const loadingButtons = document.querySelectorAll('.bt-action-button[data-loading]');

loadingButtons.forEach(button => {
  if (button.querySelector('.bt-action-button__spinner')) return;

  const spinner = document.createElement('span');
  spinner.className = 'bt-action-button__spinner';
  spinner.setAttribute('aria-hidden', 'true');
  button.appendChild(spinner);
});
