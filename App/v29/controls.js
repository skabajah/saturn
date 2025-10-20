// -------------------------
// Project Saturn - Shaka Player
// skabajah
// 2025-10-20
// -------------------------

// --- State ---
let channels = [];
let currentIndex = 0;
let isSidebarVisible = false;
let overlayTimer;

// --- DOM Elements ---
const videoElement = document.getElementById('videoPlayer');
const overlay = document.getElementById('overlay');
const sidebar = document.getElementById('sidebar');
const channelLogo = document.getElementById('channelLogo');
const channelName = document.getElementById('channelName');
const channelGroup = document.getElementById('channelGroup');
const channelChNum = document.getElementById('channelChNum');
const spinner = document.getElementById('spinner');

let player;

// --- Init Shaka ---
document.addEventListener('DOMContentLoaded', async () => {
  if (!shaka.Player.isBrowserSupported()) {
    alert("Shaka Player not supported in this browser.");
    return;
  }

  player = new shaka.Player(videoElement);
  player.addEventListener('error', e => console.error('Shaka Error', e.detail));

  // mute initially for autoplay
  videoElement.muted = true;

  // Load channels after Shaka is ready
  await loadM3U();

  // play first channel
  await playCurrentChannel();
});

// --- Platform check ---
function isDesktop() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android') && ua.includes('firetv')) return false;
  if (ua.includes('smarttv') || ua.includes('tv')) return false;
  if (ua.includes('android') && !ua.includes('mobile')) return false;
  return true;
}

// --- Core functions ---
async function changeChannel(delta) {
  if (isSidebarVisible) {
    highlightChannelByDelta(delta);
  } else {
    currentIndex = (currentIndex + delta + channels.length) % channels.length;
    await playCurrentChannel(true);
    showChannelOverlay(channels[currentIndex]);
  }
}

async function playCurrentChannel(skipOverlay = false) {
  const ch = channels[currentIndex];
  if (!ch || !player) return;

  console.log("Playing channel:", ch.name, ch.url);

  spinner.style.display = 'block';
  try {
    await player.load(ch.url);
    spinner.style.display = 'none';
  } catch (err) {
    console.error('Failed to load channel', ch.name, err);
    spinner.style.display = 'none';
  }

  highlightChannel();
  if (!skipOverlay) showChannelOverlay(ch);
}

function setSidebarVisibility(visible) {
  isSidebarVisible = visible;
  sidebar.classList.toggle('visible', visible);
  highlightChannel();
}

// --- Overlay / Sidebar ---
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
  overlayTimer = setTimeout(() => overlay.classList.remove('visible'), 4000);
}

function highlightChannel() {
  const items = sidebar.querySelectorAll('.channel');
  items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));

  if (!isSidebarVisible) return;

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

// --- Stop playback ---
async function stopAllChannels() {
  if (player) await player.unload();
}

// --- Keyboard / Remote ---
document.addEventListener('keydown', async e => {
  const keysHandled = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace','f','F'];
  if (keysHandled.includes(e.key) || keysHandled.includes(e.keyCode)) e.preventDefault();

  switch(e.key) {
    case 'ArrowUp': await changeChannel(-1); break;
    case 'ArrowDown': await changeChannel(1); break;
    case 'ArrowLeft':
    case 'ArrowRight': setSidebarVisibility(!isSidebarVisible); break;
    case 'Enter':
    case ' ':
      if (isSidebarVisible) await playCurrentChannel(); break;
    case 'Escape':
    case 'Backspace': setSidebarVisibility(false); break;
    case 'f':
    case 'F': if (isDesktop()) toggleFullscreen(); break;
  }
});

// --- Click / Touch ---
document.addEventListener('click', async e => {
  const targetChannel = e.target.closest('.channel');
  if (targetChannel) {
    const items = Array.from(sidebar.querySelectorAll('.channel'));
    const i = items.indexOf(targetChannel);
    if (i >= 0) {
      currentIndex = i;
      await playCurrentChannel();
    }
  }
});

let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchend', async e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 50) setSidebarVisibility(true);
    else if (dx < -50) setSidebarVisibility(false);
  } else {
    if (dy < -50) await changeChannel(1);
    else if (dy > 50) await changeChannel(-1);
  }
}, { passive: false });

// --- M3U Loader ---
async function loadM3U() {
  try {
    const res = await fetch('https://skabajah.github.io/saturn/saturn.m3u');
    const text = await res.text();
    const lines = text.split('\n');

    channels = [];
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
  } catch (err) {
    console.error('Failed to load M3U:', err);
  }
}

// --- Sidebar ---
function buildSidebar() {
  sidebar.innerHTML = '';
  let lastGroup = '';
  channels.forEach((ch, i) => {
    if (ch.group && ch.group !== lastGroup) {
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
    div.onclick = async () => { currentIndex = i; await playCurrentChannel(); };
    sidebar.appendChild(div);
  });
}

// --- Fullscreen ---
function toggleFullscreen() {
  if (!isDesktop()) return;
  if (!document.fullscreenElement) videoElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// --- Stop on exit ---
window.addEventListener('beforeunload', stopAllChannels);
