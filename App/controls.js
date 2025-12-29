// --- State ---
let channels = [];
let currentIndex = 0;
let currentChannelId = null; // the number before ")"

// --- Helpers ---
function parseChannelId(name) {
  const m = String(name || '').match(/^(\d+)\)\s*/);
  return m ? Number(m[1]) : null;
}

function setCurrentById(id) {
  const idx = channels.findIndex(ch => ch.id === Number(id));
  if (idx >= 0) {
    currentIndex = idx;
    currentChannelId = channels[idx].id;
    return true;
  }
  return false;
}

function persistChannelId(id) {
  currentChannelId = id ?? null;
  if (id == null) localStorage.removeItem('saturn_channel_id');
  else localStorage.setItem('saturn_channel_id', String(id));
}

function restoreChannelId() {
  const v = localStorage.getItem('saturn_channel_id');
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// --- Core ---
function changeChannel(delta) {
  if (!channels.length) return;

  currentIndex = (currentIndex + delta + channels.length) % channels.length;
  persistChannelId(channels[currentIndex].id);

  playCurrentChannel(true);
  showChannelOverlay(channels[currentIndex]);
  showMenu();
}

function playCurrentChannel(skipOverlay = false) {
  const ch = channels[currentIndex];
  if (!ch) return;

  persistChannelId(ch.id);

  spinner.style.display = 'block';
  player.src = ch.url;

  player.play().catch(() => {});
  player.oncanplay = () => spinner.style.display = 'none';
  player.onerror = () => spinner.style.display = 'none';

  highlightChannelById(ch.id);
  if (!skipOverlay) showChannelOverlay(ch);

  showMenu();
}

// --- Highlight (by channel id, not index) ---
function highlightChannelById(id) {
  const items = Array.from(menuBar.querySelectorAll('.channel'));
  items.forEach(el => el.classList.toggle('active', Number(el.dataset.chid) === Number(id)));

  const active = items.find(el => Number(el.dataset.chid) === Number(id));
  if (!active) return;

  active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// --- M3U ---
async function loadM3U() {
  channels = [];

  const res = await fetch('https://skabajah.github.io/saturn/saturn.m3u');
  const text = await res.text();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue;

    const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || '';
    const group = lines[i].match(/group-title="([^"]+)"/)?.[1] || '';
    const name = lines[i].split(',')[1]?.trim() || 'Unknown';
    const url = lines[i + 1]?.trim();
    const id = parseChannelId(name);

    if (url?.startsWith('http')) channels.push({ id, name, logo, group, url });
  }

  buildMenuBar();

  const savedId = restoreChannelId();
  if (savedId != null && setCurrentById(savedId)) {
    highlightChannelById(savedId);
    showChannelOverlay(channels[currentIndex]);
  } else {
    currentIndex = 0;
    persistChannelId(channels[0]?.id ?? null);
    highlightChannelById(channels[0]?.id);
    showChannelOverlay(channels[0]);
  }

  showMenu();
}

// --- Menu builder (add data-chid) ---
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
      div.dataset.chid = ch.id ?? ''; // <-- key part

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
        persistChannelId(ch.id);
        playCurrentChannel();
      };

      row.appendChild(div);
    });

    box.appendChild(title);
    box.appendChild(row);
    menuBar.appendChild(box);
  }
}

// --- Init ---
window.initPlayer = async () => {
  await loadM3U();
  playCurrentChannel(true);
};
