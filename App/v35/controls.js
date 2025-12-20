// -------------------------
// Project Saturn
// skabajah
// 2025-12-20
// v35.js
// -------------------------

// --- State ---
let channels = [];
let currentIndex = 0;

let overlayTimer;
let isMenuVisible = true;
let menuTimer;

// --- Elements ---
const player = document.getElementById('videoPlayer');
const overlay = document.getElementById('overlay');
const menuBar = document.getElementById('menuBar');
const channelLogo = document.getElementById('channelLogo');
const channelName = document.getElementById('channelName');
const channelGroup = document.getElementById('channelGroup');
const channelChNum = document.getElementById('channelChNum');
const spinner = document.getElementById('spinner');

// --- Platform ---
function isDesktop() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android') && ua.includes('firetv')) return false;
  if (ua.includes('smarttv') || ua.includes('tv')) return false;
  if (ua.includes('android') && !ua.includes('mobile')) return false;
  return true;
}

// --- Menu show/hide + timeout ---
function showMenu() {
  isMenuVisible = true;
  menuBar.classList.remove('hidden');
  resetMenuTimer();
}

function hideMenu() {
  isMenuVisible = false;
  menuBar.classList.add('hidden');
  clearTimeout(menuTimer);
}

function resetMenuTimer() {
  clearTimeout(menuTimer);
  menuTimer = setTimeout(() => hideMenu(), 4000); // 4s
}

// --- Core ---
function changeChannel(delta) {
  if (!channels.length) return;
  currentIndex = (currentIndex + delta + channels.length) % channels.length;
  playCurrentChannel(true);
  showChannelOverlay(channels[currentIndex]);
  showMenu();
}

function playCurrentChannel(skipOverlay = false) {
  const ch = channels[currentIndex];
  if (!ch) return;

  spinner.style.display = 'block';
  player.src = ch.url;

  player.play().catch(() => {});
  player.oncanplay = () => spinner.style.display = 'none';

  highlightChannel();
  if (!skipOverlay) showChannelOverlay(ch);

  showMenu();
}

// --- Overlay ---
function showChannelOverlay(ch) {
  if (!ch) return;

  channelLogo.src = ch.logo || '';
  channelGroup.textContent = ch.group || '';

  const match = ch.name.match(/^(\d+)\)\s*(.*)/);
  channelChNum.textContent = match ? match[1] : '';
  channelName.textContent = match ? match[2] : ch.name;

  overlay.classList.add('visible');
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => overlay.classList.remove('visible'), 4000);
}

// --- Highlight + horizontal scroll ---
function highlightChannel() {
  const items = menuBar.querySelectorAll('.channel');
  items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));

  const active = items[currentIndex];
  if (!active) return;

  const barWidth = menuBar.clientWidth;
  const center = barWidth / 2 - active.offsetWidth / 2;
  let target = active.offsetLeft - center;
  const max = menuBar.scrollWidth - barWidth;

  if (target < 0) target = 0;
  if (target > max) target = max;

  menuBar.scrollTo({ left: target, behavior: 'smooth' });
}

// --- Keyboard / Remote ---
document.addEventListener('keydown', e => {
  const handled = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Escape','Backspace','f','F'];
  if (handled.includes(e.key)) e.preventDefault();

  switch (e.key) {
    case 'ArrowLeft':
      changeChannel(-1);
      break;

    case 'ArrowRight':
      changeChannel(1);
      break;

    case 'ArrowUp':
      showMenu();
      showChannelOverlay(channels[currentIndex]);
      break;

    case 'ArrowDown':
      if (isMenuVisible) hideMenu();
      else showMenu();
      break;

    case 'Enter':
    case ' ':
      playCurrentChannel();
      break;

    case 'Escape':
    case 'Backspace':
      hideMenu();
      break;

    case 'f':
    case 'F':
      if (isDesktop()) toggleFullscreen();
      break;
  }
});

// --- Click ---
document.addEventListener('click', e => {
  showMenu();

  const chEl = e.target.closest('.channel');
  if (!chEl) return;

  const items = Array.from(menuBar.querySelectorAll('.channel'));
  const i = items.indexOf(chEl);
  if (i >= 0) {
    currentIndex = i;
    playCurrentChannel();
  }
});

// --- Touch ---
let startX = 0, startY = 0;

document.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  showMenu();

  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 50) changeChannel(-1);
    else if (dx < -50) changeChannel(1);
  } else {
    showChannelOverlay(channels[currentIndex]);
  }
}, { passive: true });

// --- M3U ---
async function loadM3U() {
  const res = await fetch('https://skabajah.github.io/saturn/saturn.m3u');
  const text = await res.text();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue;

    const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || '';
    const group = lines[i].match(/group-title="([^"]+)"/)?.[1] || '';
    const name = lines[i].split(',')[1]?.trim() || 'Unknown';
    const url = lines[i + 1]?.trim();

    if (url?.startsWith('http')) channels.push({ name, logo, group, url });
  }

  buildMenuBar();
  highlightChannel();
  showMenu();
  playCurrentChannel();
}

// --- Menu builder (card layout) ---
function buildMenuBar() {
  menuBar.innerHTML = '';

  channels.forEach((ch, i) => {
    const div = document.createElement('div');
    div.className = 'channel';

    const match = ch.name.match(/^(\d+)\)\s*(.*)/);
    const num = match ? match[1] : '';
    const name = match ? match[2] : ch.name;
    const group = ch.group || '';

    div.innerHTML = `
      <div class="group">${group}</div>
      <img src="${ch.logo}" alt="">
      <div class="bottom">
        <span class="num">${num}</span>
        <span class="name">${name}</span>
      </div>
    `;

    div.onclick = () => {
      currentIndex = i;
      playCurrentChannel();
    };

    menuBar.appendChild(div);
  });
}

// --- Fullscreen ---
function toggleFullscreen() {
  if (!document.fullscreenElement) player.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// --- Cleanup ---
window.addEventListener('beforeunload', () => {
  player.pause();
  player.currentTime = 0;
});

// --- Init ---
loadM3U();
