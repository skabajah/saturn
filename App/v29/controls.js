// -------------------------
// Saturn v29 - Shaka Controls (Fixed)
// -------------------------

let channels = [];
let currentIndex = 0;
let isSidebarVisible = false;
let overlayTimer;
let firstInteraction = false;

const overlay = document.getElementById('overlay');
const sidebar = document.getElementById('sidebar');
const channelLogo = document.getElementById('channelLogo');
const channelName = document.getElementById('channelName');
const channelGroup = document.getElementById('channelGroup');
const channelChNum = document.getElementById('channelChNum');
const spinner = document.getElementById('spinner');

let video;
let player;

// --- Initialize Shaka after DOM and window ready ---
function initPlayer() {
  video = window.shakaVideo || document.getElementById('videoElement');
  if (!video) {
    console.error('Video element not found!');
    return;
  }

  player = window.shakaPlayer || new shaka.Player(video);

  // Listen for errors
  player.addEventListener('error', e => {
    console.error('Shaka error:', e.detail);
  });
}

// --- Unlock autoplay on first interaction ---
function unlockAutoplay() {
  if (firstInteraction) return;
  firstInteraction = true;
  document.removeEventListener('keydown', unlockAutoplay);
  document.removeEventListener('click', unlockAutoplay);

  if (!player || !video) initPlayer();

  // Mute video first to allow autoplay
  video.muted = true;
  playCurrentChannel();
}

document.addEventListener('keydown', unlockAutoplay);
document.addEventListener('click', unlockAutoplay);

// --- Load M3U ---
async function loadM3U() {
  try {
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
  } catch (e) {
    console.error('Failed to load M3U:', e);
  }
}

// --- Build sidebar ---
function buildSidebar() {
  sidebar.innerHTML = '';
  let lastGroup = '';
  channels.forEach((ch, i) => {
    if (ch.group !== lastGroup && ch.group) {
      const groupDiv = document.createElement('div');
      groupDiv.textContent = ch.group;
      groupDiv.className = 'group-header';
      sidebar.appendChild(groupDiv);
      lastGroup = ch.group;
    }
    const div = document.createElement('div');
    div.className = 'channel';
    const match = ch.name.match(/^(\d+)\)\s*/);
    let chNum = '', displayName = ch.name;
    if (match) {
      chNum = match[1];
      displayName = ch.name.replace(/^(\d+\)\s*)/, '');
    }
    div.innerHTML = `<img src="${ch.logo}" alt="logo"><span class="ch-num">${chNum}</span><span>${displayName}</span>`;
    div.onclick = () => { currentIndex = i; playCurrentChannel(); };
    sidebar.appendChild(div);
  });
}

// --- Play channel ---
async function playCurrentChannel() {
  const ch = channels[currentIndex];
  if (!ch || !player || !video) return;

  spinner.style.display = 'block';
  try {
    await player.load(ch.url);
    await video.play().catch(() => {
      console.warn('Autoplay prevented, video is muted');
    });
    showChannelOverlay(ch);
    highlightChannel();
    console.log('Playing channel:', ch.name, ch.url);
  } catch (e) {
    console.error('Failed to load channel:', ch.name, e);
  } finally {
    spinner.style.display = 'none';
  }
}

// --- Change channel ---
function changeChannel(delta) {
  if (isSidebarVisible) {
    highlightChannelByDelta(delta);
  } else {
    currentIndex = (currentIndex + delta + channels.length) % channels.length;
    playCurrentChannel();
  }
}

// --- Highlight sidebar ---
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
  targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
  sidebar.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

function highlightChannelByDelta(delta) {
  let nextIndex = currentIndex;
  let safety = 0;
  do {
    nextIndex = (nextIndex + delta + channels.length) % channels.length;
    safety++;
    if (safety > channels.length) break;
  } while (!channels[nextIndex]);
  currentIndex = nextIndex;
  highlightChannel();
}

// --- Show overlay ---
function showChannelOverlay(ch) {
  if (!ch) return;
  channelLogo.src = ch.logo;
  const match = ch.name.match(/^(\d+)\)\s*(.*)/);
  channelChNum.textContent = match ? match[1] : '';
  channelName.textContent = match ? match[2] : ch.name;
  channelGroup.textContent = ch.group;

  overlay.classList.add('visible');
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => overlay.classList.remove('visible'), 4000);
}

// --- Sidebar toggle ---
function setSidebarVisibility(visible) {
  isSidebarVisible = visible;
  sidebar.classList.toggle('visible', visible);
  highlightChannel();
}

// --- Keyboard / remote ---
document.addEventListener('keydown', e => {
  switch(e.key) {
    case 'ArrowUp': changeChannel(-1); break;
    case 'ArrowDown': changeChannel(1); break;
    case 'ArrowLeft':
    case 'ArrowRight': setSidebarVisibility(!isSidebarVisible); break;
    case 'Enter':
    case ' ': if (isSidebarVisible) playCurrentChannel(); break;
    case 'Escape':
    case 'Backspace': setSidebarVisibility(false); break;
  }
});

// --- Touch swipe ---
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 50) setSidebarVisibility(true);
    else if (dx < -50) setSidebarVisibility(false);
  } else {
    if (dy < -50) changeChannel(1);
    else if (dy > 50) changeChannel(-1);
  }
}, { passive: false });

// --- Stop playback ---
function stopAllChannels() {
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
}
window.addEventListener('beforeunload', stopAllChannels);

// --- Init ---
loadM3U();
