// --- State variables ---
let channels = [];
let currentIndex = 0;
let isPlaying = true;              // play/pause state
let isSidebarVisible = false;      // sidebar visibility state
let overlayTimer;                  // overlay timeout

const player = document.getElementById('videoPlayer');
const overlay = document.getElementById('overlay');
const sidebar = document.getElementById('sidebar');
const channelLogo = document.getElementById('channelLogo');
const channelName = document.getElementById('channelName');
const channelGroup = document.getElementById('channelGroup');
const channelChNum = document.getElementById('channelChNum');
const pauseOverlay = document.getElementById('pauseOverlay');

// --- Platform check ---
function isDesktop() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android') && ua.includes('firetv')) return false;
  if (ua.includes('smarttv') || ua.includes('tv')) return false;
  if (ua.includes('android') && !ua.includes('mobile')) return false;
  return true;
}

// --- Core functions ---
// Action 1: Play/Pause
function setPlayState(playing) {
  isPlaying = playing;
  if (isPlaying === true) {
    player.play();
    hidePauseOverlay();
  } else {
    player.pause();
    showPauseOverlay();
  }
  showChannelOverlay(channels[currentIndex]);
}

// Action 2: Change channel
function changeChannel(delta) {
  if (isSidebarVisible === true) {
    highlightChannelByDelta(delta); // just highlight
  } else {
    currentIndex = (currentIndex + delta + channels.length) % channels.length;
    playCurrentChannel();
  }
}

function playCurrentChannel() {
  const ch = channels[currentIndex];
  player.src = ch.url;
  setPlayState(true);
  highlightChannel();
}

// Action 3: Show/Hide Sidebar
function setSidebarVisibility(visible) {
  isSidebarVisible = visible;
  if (isSidebarVisible === true) {
    sidebar.classList.add('visible');
  } else {
    sidebar.classList.remove('visible');
  }
  highlightChannel();
}

// --- Helper functions ---
function showChannelOverlay(ch) {
  if (!ch) return;
  channelLogo.src = ch.logo;
  const match = ch.name.match(/^(\d+)\)\s*(.*)/);
  let chNum = '';
  let chDisplay = '';
  if (match) {
    chNum = match[1];
    chDisplay = match[2];
  } else {
    chDisplay = ch.name;
  }

  channelGroup.textContent = ch.group;
  channelChNum.textContent = chNum;
  channelName.textContent = chDisplay;

  overlay.classList.add('visible');
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(function() {
    overlay.classList.remove('visible');
  }, 4000);
}

function showPauseOverlay() {
  pauseOverlay.classList.add('visible');
}
function hidePauseOverlay() {
  pauseOverlay.classList.remove('visible');
}

function highlightChannel() {
  const items = sidebar.querySelectorAll('.channel');
  for (let i = 0; i < items.length; i++) {
    if (i === currentIndex) items[i].classList.add('active');
    else items[i].classList.remove('active');
  }

  if (isSidebarVisible === false) return;

  const active = items[currentIndex];
  if (!active) return;

  const sidebarHeight = sidebar.clientHeight;
  const center = sidebarHeight / 2 - active.offsetHeight / 2;
  let targetScroll = active.offsetTop - center;
  const maxScroll = sidebar.scrollHeight - sidebarHeight;
  if (targetScroll < 0) targetScroll = 0;
  if (targetScroll > maxScroll) targetScroll = maxScroll;
  sidebar.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

function highlightChannelByDelta(delta) {
  let items = sidebar.querySelectorAll('.channel');
  let nextIndex = currentIndex;
  let safety = 0;
  do {
    nextIndex = (nextIndex + delta + channels.length) % channels.length;
    safety++;
    if (safety > channels.length) break;
  } while (!channels[nextIndex] || channels[nextIndex].group === undefined);
  currentIndex = nextIndex;
  highlightChannel();
}

// --- Keyboard / Remote ---
document.addEventListener('keydown', function(e) {
  // prevent default browser movement for handled keys
  const keysHandled = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace','f','F'];
  if (keysHandled.includes(e.key) === true) e.preventDefault();

  switch(e.key) {
    case 'ArrowUp':
      changeChannel(-1);
      break;
    case 'ArrowDown':
      changeChannel(1);
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
      // intentionally interchangeable
      if (isSidebarVisible === true) setSidebarVisibility(false);
      else setSidebarVisibility(true);
      break;
    case 'Enter':
    case ' ':
      if (isSidebarVisible === true) playCurrentChannel();
      else setPlayState(!isPlaying);
      break;
    case 'Escape':
    case 'Backspace':
      setSidebarVisibility(false);
      break;
    case 'f':
    case 'F':
      if (isDesktop() === true) toggleFullscreen();
      break;
  }
});

// --- Mouse / Tap ---
player.addEventListener('click', function() {
  if (isSidebarVisible === false) setPlayState(!isPlaying);
  // do nothing if sidebar visible
});

// --- Swipe ---
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchend', function(e) {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // horizontal swipe
    if (dx > 50) {
      if (isSidebarVisible === true) setSidebarVisibility(false);
      else setSidebarVisibility(true);
    } else if (dx < -50) {
      if (isSidebarVisible === true) setSidebarVisibility(false);
      else setSidebarVisibility(true);
    }
  } else {
    // vertical swipe
    if (dy > 50) changeChannel(-1);
    else if (dy < -50) changeChannel(1);
  }
}, { passive: false });

// --- M3U Loader ---
async function loadM3U() {
  const res = await fetch('https://skabajah.github.io/saturn/saturn.m3u');
  const text = await res.text();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
      const groupMatch = lines[i].match(/group-title="([^"]+)"/);
      const name = lines[i].split(',')[1]?.trim() || 'Unknown';
      const logo = logoMatch ? logoMatch[1] : '';
      const group = groupMatch ? groupMatch[1] : '';
      const url = lines[i + 1]?.trim();
      if (url && url.startsWith('http')) channels.push({ name, logo, url, group });
    }
  }
  buildSidebar();
  playCurrentChannel();
}

// --- Sidebar builder ---
function buildSidebar() {
  sidebar.innerHTML = '';
  let lastGroup = '';
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    if (ch.group !== lastGroup && ch.group) {
      const groupDiv = document.createElement('div');
      groupDiv.textContent = ch.group;
      groupDiv.className = 'group-header';
      sidebar.appendChild(groupDiv);
      lastGroup = ch.group;
    }

    const div = document.createElement('div');
    div.className = 'channel';
    let chNum = '';
    let displayName = ch.name;
    const match = ch.name.match(/^(\d+)\)\s*/);
    if (match) {
      chNum = match[1];
      displayName = ch.name.replace(/^(\d+\)\s*)/, '');
    }
    div.innerHTML = `<img src="${ch.logo}" alt="logo"><span class="ch-num">${chNum}</span><span>${displayName}</span>`;
    div.onclick = function() { currentIndex = i; playCurrentChannel(); };
    sidebar.appendChild(div);
  }
}

// --- Fullscreen ---
function toggleFullscreen() {
  if (isDesktop() === false) return;
  if (!document.fullscreenElement) player.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// --- Init ---
loadM3U();
