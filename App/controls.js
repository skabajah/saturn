// -------------------------
// Project Saturn
// skabajah
// 2025-12-20
// -------------------------

// --- State ---
let channels = [];
let currentIndex = 0;

let overlayTimer;
let isMenuVisible = true;
let menuTimer;
let isLoading = false;

const switchSound = new Audio('pop.mp3');
switchSound.preload = 'auto';

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
  // resetMenuTimer();
  // shrinkPlayerTemporarily();
  // showChannelOverlay(channels[currentIndex]);

}

function hideMenu() {
  if (isLoading) return; // prevent hiding while spinner is active
  isMenuVisible = false;
  menuBar.classList.add('hidden');
  clearTimeout(menuTimer);
}

function resetMenuTimer() {
  clearTimeout(menuTimer);
  menuTimer = setTimeout(() => hideMenu(), 5000);
}

// --- Core ---
function changeChannel(delta) {
  if (!channels.length) return;
  currentIndex = (currentIndex + delta + channels.length) % channels.length;
  
  // play audio effect
  // switchSound.currentTime = 0; // reset to start
  // switchSound.play().catch(() => {});


  playCurrentChannel(true);
  // showChannelOverlay(channels[currentIndex]);
  showMenu();
}




function playCurrentChannel(skipOverlay = false) {
  const ch = channels[currentIndex];
  if (!ch) return;

  isLoading = true;
  spinner.style.display = 'block';
  player.src = ch.url;

  player.play().catch(() => {});

  player.oncanplay = () => {
    spinner.style.display = 'none';
    isLoading = false;
    showMenu();       // show menu now
    resetMenuTimer(); // start hide timer
  };

  player.onerror = () => {
    spinner.style.display = 'none';
    isLoading = false;
    showMenu();
    resetMenuTimer();
  };

  highlightChannel();
  // if (!skipOverlay) showChannelOverlay(ch);

  // REMOVE showMenu() from here
}



// --- Overlay ---

// function showChannelOverlay(ch) {
//   if (!ch) return;

//   channelLogo.src = ch.logo || '';
//   channelGroup.textContent = ch.group || '';

//   const match = ch.name.match(/^(\d+)\)\s*(.*)/);
//   channelChNum.textContent = match ? match[1] : '';
//   channelName.textContent = match ? match[2] : ch.name;

//   overlay.classList.add('visible');
//   clearTimeout(overlayTimer);
//   overlayTimer = setTimeout(() => overlay.classList.remove('visible'), 4000);
// }

// --- Highlight + scroll ---
function highlightChannel() {
  const items = Array.from(menuBar.querySelectorAll('.channel'));
  items.forEach((el, i) => el.classList.toggle('active', i === currentIndex));

  const active = items[currentIndex];
  if (!active) return;

  active.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest'
  });
}

function ensureMenuVisible() {
  if (!isMenuVisible) {
    showMenu();
    return false; // menu was hidden
  }
  return true; // menu already visible
}

// --- Keyboard / Remote ---
document.addEventListener('keydown', e => {
  const handled = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Escape','Backspace','f','F'];
  if (handled.includes(e.key)) e.preventDefault();

  switch (e.key) {
    // case 'ArrowLeft':  changeChannel(-1); break;
    // case 'ArrowRight': changeChannel(1); break;
    case 'ArrowLeft':
      if (!ensureMenuVisible()) break; // mimic UP first
      changeChannel(-1);
      break;

    case 'ArrowRight':
      if (!ensureMenuVisible()) break; // mimic UP first
      changeChannel(1);
      break;

    case 'ArrowUp':
      showMenu();
      // showChannelOverlay(channels[currentIndex]);
      break;

    case 'ArrowDown':
      isMenuVisible ? hideMenu() : showMenu();
      break;

    case 'Enter':
    case ' ':
      if (!ensureMenuVisible()) break; // mimic UP first
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
  const idx = items.indexOf(chEl);
  if (idx >= 0) {
    currentIndex = idx;
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
    dx > 50 ? changeChannel(-1) : dx < -50 && changeChannel(1);
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

    if (url?.startsWith('http')) {
      channels.push({ name, logo, group, url });
    }
  }

  buildMenuBar();
  highlightChannel();
  playCurrentChannel();
  showMenu();
}

// --- Menu builder (GROUP BOXES) ---
function buildMenuBar() {
  menuBar.innerHTML = '';

  const groups = new Map();
  channels.forEach((ch, idx) => {
    const g = (ch.group || 'Other').trim() || 'Other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({ ch, idx });
  });

  for (const [groupName, list] of groups.entries()) {
    const box = document.createElement('div');
    box.className = 'group-box';

    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = groupName;

    const row = document.createElement('div');
    row.className = 'group-row';

    list.forEach(({ ch, idx }) => {
      const div = document.createElement('div');
      div.className = 'channel';

      const match = ch.name.match(/^(\d+)\)\s*(.*)/);
      const num = match ? match[1] : '';
      const label = match ? match[2] : ch.name;

      div.innerHTML = `
        <div class="num">${num}</div>
        <img src="${ch.logo}" alt="">
        <div class="name">${label}</div>
      `;

      div.onclick = () => {
        currentIndex = idx;
        playCurrentChannel();
      };

      row.appendChild(div);
    });

    box.appendChild(title);
    box.appendChild(row);
    menuBar.appendChild(box);
  }
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

//-- Shrink Video 
// function shrinkPlayerTemporarily() {
//   player.classList.add('video-min');

//   clearTimeout(player._shrinkTimer);
//   player._shrinkTimer = setTimeout(() => {
//     player.classList.remove('video-min');
//   }, 4000);
// }


// --- Init ---
loadM3U();
