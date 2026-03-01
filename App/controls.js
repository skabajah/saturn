// -------------------------
// Project Saturn
// skabajah
// 2026-02-28
// light 
// -------------------------

// --- State ---
let channels = [];
let currentIndex = 0;
let lastIndex = 0;               // for wrap detection
let isMenuVisible = true;
let menuTimer;
let isLoading = false;

// --- Elements ---
const player = document.getElementById('videoPlayer');
const menuBar = document.getElementById('menuBar');

// --- Menu show/hide + timeout ---
function showMenu() {
  isMenuVisible = true;
  menuBar.classList.remove('hidden');
  resetMenuTimer();
}

function hideMenu() {
  if (isLoading) return;          // prevent hiding while loading
  isMenuVisible = false;
  menuBar.classList.add('hidden');
  clearTimeout(menuTimer);
}

function resetMenuTimer() {
  clearTimeout(menuTimer);
  menuTimer = setTimeout(() => hideMenu(), 3500);
}

// --- Core ---
function changeChannel(delta) {
  if (!channels.length) return;
  currentIndex = (currentIndex + delta + channels.length) % channels.length;
  playCurrentChannel();
  showMenu();
}

function playCurrentChannel() {
  const ch = channels[currentIndex];
  if (!ch) return;

  isLoading = true;
  player.src = ch.url;

  player.play().catch(() => {});

  player.oncanplay = () => {
    isLoading = false;
    showMenu();
    resetMenuTimer();
  };

  player.onerror = () => {
    isLoading = false;
    showMenu();
    resetMenuTimer();
  };

  highlightChannel();
}

// --- Highlight and scroll ---
function highlightChannel() {
  const items = Array.from(menuBar.querySelectorAll('.channel'));
  items.forEach((el, i) => el.classList.toggle('active', i === currentIndex));

  const active = items[currentIndex];
  if (!active) return;

  // Detect wrap‑around
  const wrapped = (lastIndex === items.length - 1 && currentIndex === 0) ||
                  (lastIndex === 0 && currentIndex === items.length - 1);
  lastIndex = currentIndex;

  if (wrapped) {
    // Temporarily disable smooth scrolling
    const originalBehavior = menuBar.style.scrollBehavior;
    menuBar.style.scrollBehavior = 'auto';

    // Jump instantly to centered position
    const menuBarWidth = menuBar.offsetWidth;
    const activeOffsetLeft = active.offsetLeft;
    const activeWidth = active.offsetWidth;
    let targetScroll = activeOffsetLeft - (menuBarWidth / 2) + (activeWidth / 2);
    targetScroll = Math.max(0, Math.min(targetScroll, menuBar.scrollWidth - menuBarWidth));
    menuBar.scrollLeft = targetScroll;

    // Restore original scroll behavior
    menuBar.style.scrollBehavior = originalBehavior;

    // Pulse animation to indicate loop
    menuBar.classList.add('wrap-pulse');
    setTimeout(() => menuBar.classList.remove('wrap-pulse'), 300);
  } else {
    // Normal smooth scroll
    active.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }
}

// Helper to show menu if hidden, returns true if it was already visible
function ensureMenuVisible() {
  if (!isMenuVisible) {
    showMenu();
    return false;
  }
  return true;
}

// --- Keyboard / Remote ---
document.addEventListener('keydown', e => {
  const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape', 'Backspace', 'f', 'F'];
  if (handled.includes(e.key)) e.preventDefault();

  switch (e.key) {
    case 'ArrowLeft':
      if (!ensureMenuVisible()) break;
      changeChannel(-1);
      break;

    case 'ArrowRight':
      if (!ensureMenuVisible()) break;
      changeChannel(1);
      break;

    case 'ArrowUp':
      showMenu();
      break;

    case 'ArrowDown':
      isMenuVisible ? hideMenu() : showMenu();
      break;

    case 'Enter':
    case ' ':
      if (!ensureMenuVisible()) break;
      playCurrentChannel();
      break;

    case 'Escape':
    case 'Backspace':
      hideMenu();
      break;

    case 'f':
    case 'F':
      // Simple fullscreen check (no UA sniffing)
      if (document.documentElement.requestFullscreen) toggleFullscreen();
      break;
  }
});

// --- Click on channel ---
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

// --- Touch swipe ---
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
    // Adjust signs if you prefer right swipe → next channel
    if (dx > 50) changeChannel(-1);   // right swipe = previous
    else if (dx < -50) changeChannel(1); // left swipe = next
  }
  // vertical swipe intentionally ignored
}, { passive: true });

// --- M3U loading with basic error handling ---
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

// --- Fullscreen toggle ---
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    player.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

// --- Cleanup on page unload ---
window.addEventListener('beforeunload', () => {
  player.pause();
  player.currentTime = 0;
});

// --- Init ---
loadM3U();