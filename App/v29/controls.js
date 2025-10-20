// -------------------------
// Project Saturn Controls (Video.js + HLS.js)
// -------------------------
let channels = [];
let currentIndex = 0;
let isSidebarVisible = false;
let overlayTimer;

const overlay = document.getElementById('overlay');
const sidebar = document.getElementById('sidebar');
const channelLogo = document.getElementById('channelLogo');
const channelName = document.getElementById('channelName');
const channelGroup = document.getElementById('channelGroup');
const channelChNum = document.getElementById('channelChNum');
const spinner = document.getElementById('spinner');

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const player = videojs('my-video', { autoplay: true, controls: false, muted: false });
let hlsInstance = null;

// -------------------------
// Channel Playback
// -------------------------
function playCurrentChannel(skipOverlay = false) {
  const ch = channels[currentIndex];
  if (!ch) return;
  
  spinner.style.display = 'block';
  
  const url = ch.url;

  if (isSafari) {
    // Safari native HLS
    player.src({ src: url, type: 'application/x-mpegURL' });
    player.play().catch(()=>{});
    player.one('play', () => spinner.style.display = 'none');
  } else {
    // Chrome / Android / Fire TV: HLS.js
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(player.tech().el());

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        player.play().catch(()=>{});
        spinner.style.display='none';
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS.js error', data);
        spinner.style.display='none';
        alert('Failed to load stream. Check URL / CORS / token.');
      });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      // fallback
      player.src({ src: url, type: 'application/x-mpegURL' });
      player.play().catch(()=>{});
      player.one('play', () => spinner.style.display='none');
    } else {
      alert('HLS not supported in this browser.');
      spinner.style.display='none';
    }
  }

  highlightChannel();
  if (!skipOverlay) showChannelOverlay(ch);
}

function changeChannel(delta) {
  if (isSidebarVisible) {
    highlightChannelByDelta(delta);
  } else {
    currentIndex = (currentIndex + delta + channels.length) % channels.length;
    playCurrentChannel(true);
    showChannelOverlay(channels[currentIndex]);
  }
}

// -------------------------
// Sidebar / Overlay
// -------------------------
function setSidebarVisibility(visible) {
  isSidebarVisible = visible;
  sidebar.classList.toggle('visible', visible);
  highlightChannel();
}

function showChannelOverlay(ch) {
  if (!ch) return;
  channelLogo.src = ch.logo;
  const match = ch.name.match(/^(\d+)\)\s*(.*)/);
  let chNum = match ? match[1] : '';
  let chDisplay = match ? match[2] : ch.name;
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
  } while (!channels[nextIndex] || channels[nextIndex].group === undefined);
  currentIndex = nextIndex;
  highlightChannel();
}

// -------------------------
// Stop / Fullscreen
// -------------------------
function stopAllChannels() {
  player.pause();
  if (hlsInstance) hlsInstance.stopLoad();
  player.currentTime(0);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) player.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// -------------------------
// Keyboard / Remote
// -------------------------
document.addEventListener('keydown', e => {
  const keysHandled = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace','f','F'];
  if (keysHandled.includes(e.key) || keysHandled.includes(e.keyCode)) e.preventDefault();
  switch(e.key){
    case 'ArrowUp': changeChannel(-1); break;
    case 'ArrowDown': changeChannel(1); break;
    case 'ArrowLeft':
    case 'ArrowRight': setSidebarVisibility(!isSidebarVisible); break;
    case 'Enter':
    case ' ':
      if (isSidebarVisible) playCurrentChannel();
      break;
    case 'Escape':
    case 'Backspace': setSidebarVisibility(false); break;
    case 'f':
    case 'F': toggleFullscreen(); break;
  }
});

// -------------------------
// Click / Tap / Swipe
// -------------------------
document.addEventListener('click', e => {
  const targetChannel = e.target.closest('.channel');
  if (targetChannel) {
    const items = Array.from(sidebar.querySelectorAll('.channel'));
    const i = items.indexOf(targetChannel);
    if (i >= 0) {
      currentIndex = i;
      playCurrentChannel();
    }
  }
});

let touchStartX=0, touchStartY=0;
document.addEventListener('touchstart', e => { touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; }, { passive: false });
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

// -------------------------
// M3U Loader
// -------------------------
async function loadM3U() {
  const res = await fetch('https://skabajah.github.io/saturn/raw.m3u');
  const text = await res.text();
  const lines = text.split('\n');
  for (let i=0;i<lines.length;i++){
    if(lines[i].startsWith('#EXTINF')){
      const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
      const groupMatch = lines[i].match(/group-title="([^"]+)"/);
      const name = lines[i].split(',')[1]?.trim() || 'Unknown';
      const logo = logoMatch ? logoMatch[1] : '';
      const group = groupMatch ? groupMatch[1] : '';
      const url = lines[i+1]?.trim();
      if(url && url.startsWith('http')) channels.push({name, logo, url, group});
    }
  }
  buildSidebar();
  playCurrentChannel();
}

// -------------------------
// Sidebar Builder
// -------------------------
function buildSidebar() {
  sidebar.innerHTML='';
  let lastGroup='';
  for(let i=0;i<channels.length;i++){
    const ch = channels[i];
    if(ch.group !== lastGroup && ch.group){
      const groupDiv = document.createElement('div');
      groupDiv.textContent = ch.group;
      groupDiv.className='group-header';
      sidebar.appendChild(groupDiv);
      lastGroup = ch.group;
    }
    const div = document.createElement('div');
    div.className='channel';
    let chNum=''; let displayName = ch.name;
    const match = ch.name.match(/^(\d+)\)\s*/);
    if(match){ chNum=match[1]; displayName = ch.name.replace(/^(\d+\)\s*)/, ''); }
    div.innerHTML=`<img src="${ch.logo}" alt="logo"><span class="ch-num">${chNum}</span><span>${displayName}</span>`;
    div.onclick = ()=>{ currentIndex=i; playCurrentChannel(); };
    sidebar.appendChild(div);
  }
}

// -------------------------
// Stop on exit / Init
// -------------------------
window.addEventListener('beforeunload', stopAllChannels);
loadM3U();
