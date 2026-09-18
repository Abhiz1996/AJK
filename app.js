document.documentElement.classList.add('has-motion');

const openButton = document.getElementById('openInvitation');
const invitation = document.getElementById('invitation');
const reveal = document.getElementById('reveal');
const musicToggle = document.getElementById('musicToggle');
const musicLabel = musicToggle.querySelector('[data-music-label]');

let audioContext;
let musicMaster;
let musicScheduler;
let nextMusicCycle = 0;
let musicPlaying = false;

const musicNotes = [
  392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392,
  349.23, 392, 440, 523.25, 493.88, 440, 392, 329.63
];
const musicChords = [
  [130.81, 196, 261.63],
  [110, 164.81, 220],
  [87.31, 130.81, 174.61],
  [98, 146.83, 196]
];
const musicCycleLength = 12;

function setMusicState(playing) {
  musicPlaying = playing;
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  musicLabel.textContent = playing ? 'Music on' : 'Music';
}

function createTone(frequency, start, duration, volume, type = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(type === 'triangle' ? 1650 : 900, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.28, duration * .22));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(filter).connect(gain).connect(musicMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + .05);
}

function scheduleMusicCycle(start) {
  musicChords.forEach((chord, chordIndex) => {
    chord.forEach((frequency, voiceIndex) => {
      createTone(frequency, start + chordIndex * 3, 3.8, voiceIndex === 0 ? .08 : .035, 'sine');
    });
  });

  musicNotes.forEach((frequency, noteIndex) => {
    const noteStart = start + noteIndex * .75;
    createTone(frequency, noteStart, 1.15, noteIndex % 4 === 0 ? .11 : .072, 'triangle');
    if (noteIndex % 4 === 0) createTone(frequency * 2, noteStart + .03, .85, .018, 'sine');
  });
}

function fillMusicQueue() {
  if (!audioContext) return;
  while (nextMusicCycle < audioContext.currentTime + 5) {
    scheduleMusicCycle(nextMusicCycle);
    nextMusicCycle += musicCycleLength;
  }
}

function createMusicEngine() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return false;
  audioContext = new AudioEngine();
  musicMaster = audioContext.createGain();
  const ambience = audioContext.createDelay(2);
  const ambienceGain = audioContext.createGain();
  const limiter = audioContext.createDynamicsCompressor();
  ambience.delayTime.value = .34;
  ambienceGain.gain.value = .16;
  limiter.threshold.value = -18;
  limiter.knee.value = 18;
  limiter.ratio.value = 5;
  limiter.attack.value = .01;
  limiter.release.value = .3;
  musicMaster.gain.value = 0.0001;
  musicMaster.connect(limiter).connect(audioContext.destination);
  musicMaster.connect(ambience).connect(ambienceGain).connect(limiter);
  nextMusicCycle = audioContext.currentTime + .08;
  fillMusicQueue();
  musicScheduler = window.setInterval(fillMusicQueue, 2500);
  return true;
}

async function startWeddingMusic() {
  if (!audioContext && !createMusicEngine()) {
    musicToggle.hidden = true;
    return;
  }
  await audioContext.resume();
  const now = audioContext.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value, .0001), now);
  musicMaster.gain.exponentialRampToValueAtTime(.32, now + 1.2);
  setMusicState(true);
}

function pauseWeddingMusic() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value, .0001), now);
  musicMaster.gain.exponentialRampToValueAtTime(.0001, now + .45);
  window.setTimeout(() => audioContext.suspend(), 500);
  setMusicState(false);
}

function openInvitation() {
  startWeddingMusic();
  document.body.classList.add('opening');
  window.setTimeout(() => {
    document.body.classList.add('opened');
    invitation.setAttribute('aria-hidden', 'false');
    reveal.setAttribute('aria-hidden', 'true');
    document.querySelector('.brand').focus({ preventScroll: true });
  }, 650);
}

openButton.addEventListener('click', openInvitation);
musicToggle.addEventListener('click', () => {
  if (musicPlaying) pauseWeddingMusic();
  else startWeddingMusic();
});

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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionTargets = [
  ...document.querySelectorAll('.countdown-heading, .countdown-grid, .countdown-bar, .trivandrum-film__copy, .ceremony-section .section-heading, .ritual-explorer, .venue-photo, .venue-copy, .details-section .section-heading, .detail-grid article, .closing-card')
];

motionTargets.forEach((target, index) => {
  target.classList.add('motion-reveal');
  target.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 0.08}s`);
});

if ('IntersectionObserver' in window && !reducedMotion) {
  const motionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

  motionTargets.forEach((target) => motionObserver.observe(target));
} else {
  motionTargets.forEach((target) => target.classList.add('is-visible'));
}

if (!reducedMotion) {
  const parallaxImages = [...document.querySelectorAll('.hero-photo img, .venue-photo img, .closing-section > img')];
  let parallaxFrame = 0;

  function updateParallax() {
    parallaxFrame = 0;
    const viewportCenter = window.innerHeight / 2;
    parallaxImages.forEach((image) => {
      const bounds = image.parentElement.getBoundingClientRect();
      const sectionCenter = bounds.top + bounds.height / 2;
      const offset = Math.max(-22, Math.min(22, (viewportCenter - sectionCenter) * 0.035));
      image.style.setProperty('--parallax-y', `${offset}px`);
    });
  }

  function requestParallax() {
    if (parallaxFrame) return;
    parallaxFrame = window.requestAnimationFrame(updateParallax);
  }

  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
  requestParallax();
}
