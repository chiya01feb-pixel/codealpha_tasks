const playlist = [
  { title: "believer",   artist: "Imagine Dragons", duration: "3:24", src: "audio/believer.mp3",  hue: 270 },
  { title: "perfect",    artist: "Ed Sheeran",       duration: "4:23", src: "audio/perfect.mp3",   hue: 200 },
  { title: "namo namo",  artist: "Amit Trivedi",     duration: "4:10", src: "audio/namo namo.mp3", hue: 30  }
];

let currentIndex = 0;
let isPlaying    = false;
let isShuffle    = false;
let isRepeat     = false;
let isAutoplay   = true;
let isDragging   = false;

const audio       = document.getElementById('audio-player');
const playBtn     = document.getElementById('play-btn');
const playIcon    = document.getElementById('play-icon');
const prevBtn     = document.getElementById('prev-btn');
const nextBtn     = document.getElementById('next-btn');
const shuffleBtn  = document.getElementById('shuffle-btn');
const repeatBtn   = document.getElementById('repeat-btn');
const progressBar = document.getElementById('progress-bar');
const volumeBar   = document.getElementById('volume-bar');
const currentTime = document.getElementById('current-time');
const totalDur    = document.getElementById('total-duration');
const songTitle   = document.getElementById('song-title');
const songArtist  = document.getElementById('song-artist');
const badge       = document.getElementById('track-index-badge');
const playlistEl  = document.getElementById('playlist-list');
const trackCount  = document.getElementById('track-count');
const searchInput = document.getElementById('search-input');
const autoplayTrk = document.getElementById('autoplay-track');
const vinylSvg    = document.getElementById('vinyl-svg');
const canvas      = document.getElementById('art-canvas');
const ctx         = canvas.getContext('2d');
const volWave1    = document.getElementById('vol-wave1');
const volWave2    = document.getElementById('vol-wave2');

// ── Draw album art ──
function drawArt(hue) {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, W * .7);
  bg.addColorStop(0, `hsl(${hue},40%,14%)`);
  bg.addColorStop(1, `hsl(${hue+30},30%,6%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  [[W*.35, H*.38, 90], [W*.62, H*.58, 70], [W*.5, H*.5, 120]].forEach(([x, y, r], i) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue + i*30},80%,65%,.55)`);
    g.addColorStop(1, `hsla(${hue + i*30},80%,40%,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = `hsla(${hue},60%,60%,.07)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 24) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
  }

  ctx.save();
  ctx.strokeStyle = `hsla(${hue},90%,75%,.35)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 2) {
    const y = H/2 + Math.sin(x/18) * 28 + Math.sin(x/9) * 12;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  ctx.font = '72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = `hsla(${hue},90%,70%,.8)`;
  ctx.shadowBlur = 32;
  ctx.fillStyle = `hsla(${hue},80%,90%,.85)`;
  ctx.fillText('♪', W/2, H/2);
  ctx.shadowBlur = 0;
}

// ── Load track ──
function loadTrack(index, autoPlay = false) {
  const track = playlist[index];
  audio.src = track.src;
  audio.volume = volumeBar.value / 100;
  songTitle.textContent   = track.title;
  songArtist.textContent  = track.artist;
  badge.textContent       = `${index + 1} / ${playlist.length}`;
  totalDur.textContent    = track.duration;
  currentTime.textContent = '0:00';
  progressBar.value = 0;
  progressBar.style.setProperty('--pct', '0%');
  drawArt(track.hue);
  updatePlaylistUI();
  if (autoPlay) playAudio();
  else pauseAudio();
}

// ── Play / Pause ──
function playAudio() {
  audio.play().then(() => {
    isPlaying = true;
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    vinylSvg.classList.add('spinning');
    updatePlaylistUI();
  }).catch(() => {});
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  vinylSvg.classList.remove('spinning');
  updatePlaylistUI();
}

// ── Next / Prev ──
function nextTrack(auto = false) {
  if (isRepeat && auto) { audio.currentTime = 0; playAudio(); return; }
  let next;
  if (isShuffle) {
    do { next = Math.floor(Math.random() * playlist.length); }
    while (next === currentIndex && playlist.length > 1);
  } else {
    next = (currentIndex + 1) % playlist.length;
  }
  currentIndex = next;
  loadTrack(currentIndex, true);
}

function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentIndex, isPlaying);
}

// ── Button events ──
playBtn.addEventListener('click', () => { isPlaying ? pauseAudio() : playAudio(); });
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', () => nextTrack(false));

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
});

autoplayTrk.addEventListener('click', () => {
  isAutoplay = !isAutoplay;
  autoplayTrk.classList.toggle('on', isAutoplay);
});

// ── Progress bar ──
audio.addEventListener('timeupdate', () => {
  if (isDragging || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.value = pct;
  progressBar.style.setProperty('--pct', pct + '%');
  currentTime.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  totalDur.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('mousedown', () => { isDragging = true; });
progressBar.addEventListener('input', () => {
  const t = (progressBar.value / 100) * audio.duration;
  currentTime.textContent = formatTime(t);
  progressBar.style.setProperty('--pct', progressBar.value + '%');
});
progressBar.addEventListener('mouseup', () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
  isDragging = false;
});

// ── Volume ──
volumeBar.addEventListener('input', () => {
  const v = volumeBar.value;
  audio.volume = v / 100;
  volWave1.style.display = v == 0 ? 'none' : '';
  volWave2.style.display = v < 40 ? 'none' : '';
});

// ── Autoplay on song end ──
audio.addEventListener('ended', () => {
  isAutoplay ? nextTrack(true) : pauseAudio();
});

// ── Playlist ──
function buildPlaylist(filter = '') {
  playlistEl.innerHTML = '';
  const fl = filter.toLowerCase();
  const filtered = playlist
    .map((t, i) => ({ ...t, i }))
    .filter(t => !fl || t.title.toLowerCase().includes(fl) || t.artist.toLowerCase().includes(fl));

  trackCount.textContent = `${filtered.length} track${filtered.length !== 1 ? 's' : ''}`;

  filtered.forEach(track => {
    const row = document.createElement('div');
    row.className = 'track-item' +
      (track.i === currentIndex ? ' active' : '') +
      (track.i === currentIndex && isPlaying ? ' playing' : '');
    row.dataset.index = track.i;
    row.innerHTML = `
      <div class="track-num">
        <div class="bars-icon">
          <div class="bar" style="height:6px"></div>
          <div class="bar" style="height:10px"></div>
          <div class="bar" style="height:4px"></div>
        </div>
        <span class="track-num-val">${track.i + 1}</span>
      </div>
      <div class="track-info">
        <div class="track-name">${track.title}</div>
        <div class="track-artist-name">${track.artist}</div>
      </div>
      <div class="track-dur">${track.duration}</div>
    `;
    row.addEventListener('click', () => {
      currentIndex = track.i;
      loadTrack(currentIndex, true);
    });
    playlistEl.appendChild(row);
  });
}

function updatePlaylistUI() { buildPlaylist(searchInput.value); }
searchInput.addEventListener('input', () => buildPlaylist(searchInput.value));

// ── Helper ──
function formatTime(s) {
  if (isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// ── Init ──
loadTrack(currentIndex, false);
