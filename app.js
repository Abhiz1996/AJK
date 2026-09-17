const openButton = document.getElementById('openInvitation');
const invitation = document.getElementById('invitation');
const reveal = document.getElementById('reveal');

function openInvitation() {
  document.body.classList.add('opening');
  window.setTimeout(() => {
    document.body.classList.add('opened');
    invitation.setAttribute('aria-hidden', 'false');
    reveal.setAttribute('aria-hidden', 'true');
    document.querySelector('.brand').focus({ preventScroll: true });
  }, 650);
}

openButton.addEventListener('click', openInvitation);

const weddingDate = new Date('2026-10-25T11:15:00+05:30');
const countdownParts = {
  days: document.querySelector('[data-count="days"]'),
  hours: document.querySelector('[data-count="hours"]'),
  minutes: document.querySelector('[data-count="minutes"]'),
  seconds: document.querySelector('[data-count="seconds"]')
};

function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  countdownParts.days.textContent = String(days).padStart(2, '0');
  countdownParts.hours.textContent = String(hours).padStart(2, '0');
  countdownParts.minutes.textContent = String(minutes).padStart(2, '0');
  countdownParts.seconds.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const ritualTabs = [...document.querySelectorAll('.ritual-tabs [role="tab"]')];
const ritualPanels = [...document.querySelectorAll('.ritual-panel[role="tabpanel"]')];
const ritualPrevious = document.getElementById('ritualPrevious');
const ritualNext = document.getElementById('ritualNext');
const ritualProgressBar = document.getElementById('ritualProgressBar');
const ritualProgressLabel = document.getElementById('ritualProgressLabel');
let activeRitual = 0;

function selectRitual(index, moveFocus = false) {
  activeRitual = (index + ritualTabs.length) % ritualTabs.length;

  ritualTabs.forEach((tab, tabIndex) => {
    const selected = tabIndex === activeRitual;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  ritualPanels.forEach((panel, panelIndex) => {
    panel.classList.remove('is-entering');
    panel.hidden = panelIndex !== activeRitual;
  });

  const activePanel = ritualPanels[activeRitual];
  window.requestAnimationFrame(() => activePanel.classList.add('is-entering'));
  ritualProgressBar.style.width = `${((activeRitual + 1) / ritualTabs.length) * 100}%`;
  ritualProgressLabel.textContent = `${String(activeRitual + 1).padStart(2, '0')} / ${String(ritualTabs.length).padStart(2, '0')}`;

  if (moveFocus) ritualTabs[activeRitual].focus();
}

ritualTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectRitual(index));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') selectRitual(0, true);
    else if (event.key === 'End') selectRitual(ritualTabs.length - 1, true);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') selectRitual(index + 1, true);
    else selectRitual(index - 1, true);
  });
});

ritualPrevious.addEventListener('click', () => selectRitual(activeRitual - 1));
ritualNext.addEventListener('click', () => selectRitual(activeRitual + 1));
