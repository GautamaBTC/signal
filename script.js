// ═══════════════════════════════════════════════════════════════════
// SIGNAL — Personal Link System
// script.js v1.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ─── Configuration ─────────────────────────────────────────────────
const CONFIG = {
  TARGET_DATE:   new Date('2026-08-15T20:00:00'),
  TOGETHER_DATE: new Date('2026-01-07T00:00:00'),
  EVENT_NAME:    'СОРТАВАЛА',
  ORIGIN: {
    name:  'ШАХТЫ',
    city:  'Шахты, Ростовская обл.',
    lat:   47.7073,
    lon:   40.2150,
    coord: '47°42\'N 40°12\'E'
  },
  TARGET: {
    name:  'СОРТАВАЛА',
    city:  'Сортавала, Карелия',
    lat:   61.7078,
    lon:   30.6908,
    coord: '61°42\'N 30°41\'E'
  },
  DISTANCE_KM: 1990,
  TIMELINE_START: new Date('2026-01-07T00:00:00'),
  TIMELINE_END:   new Date('2026-08-15T00:00:00'),
  MONTHS: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG']
};

// ─── State ─────────────────────────────────────────────────────────
const state = {
  daysLeft:     0,
  daysTogether: 0,
  activeMonth:  0,
  currentTime:  new Date()
};

// ─── Utils ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $q = sel => document.querySelector(sel);

function msTodays(ms) {
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function floorDays(ms) {
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// ─── Calculations ──────────────────────────────────────────────────
function calcDaysLeft() {
  const now = new Date();
  const diff = CONFIG.TARGET_DATE - now;
  return msTodays(diff);
}

function calcDaysTogether() {
  const now = new Date();
  const diff = now - CONFIG.TOGETHER_DATE;
  return Math.max(0, floorDays(diff));
}

function calcActiveMonth() {
  const now = new Date();
  const startMonth = CONFIG.TIMELINE_START.getMonth(); // 0 = JAN
  const startYear  = CONFIG.TIMELINE_START.getFullYear();
  const nowMonth   = now.getMonth();
  const nowYear    = now.getFullYear();

  // Months from start: JAN=0, FEB=1, ..., AUG=7
  const diffMonths = (nowYear - startYear) * 12 + (nowMonth - startMonth);
  return Math.min(Math.max(diffMonths, -1), 7);
}

// ─── DOM Updates ───────────────────────────────────────────────────
function updateDaysLeft() {
  const el = $('days-count');
  if (!el) return;
  const days = calcDaysLeft();
  state.daysLeft = days;

  // Animate counter
  const current = parseInt(el.textContent) || 0;
  if (current !== days) {
    animateCounter(el, current, days, 600);
  }
}

function updateDaysTogether() {
  const el = $('history-count');
  if (!el) return;
  const days = calcDaysTogether();
  state.daysTogether = days;

  const current = parseInt(el.textContent) || 0;
  if (current !== days) {
    animateCounter(el, current, days, 800);
  }
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  const diff = to - from;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + diff * ease);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

function updateClock() {
  const now = new Date();
  state.currentTime = now;

  const timeEl = $('header-time');
  if (timeEl) timeEl.textContent = formatTime(now);
}

// ─── Timeline Rendering ────────────────────────────────────────────
function renderTimeline() {
  const container = $('timeline-months');
  if (!container) return;

  const activeIdx = calcActiveMonth();
  state.activeMonth = activeIdx;

  container.innerHTML = '';

  CONFIG.MONTHS.forEach((month, i) => {
    const block = document.createElement('div');
    block.className = 'month-block';

    let status = 'future';
    if (i < activeIdx) status = 'passed';
    else if (i === activeIdx) status = 'active';

    block.classList.add(status);

    // Dots symbol
    let dotsSymbol = '';
    if (status === 'passed')  dotsSymbol = '■■';
    else if (status === 'active') dotsSymbol = '◈';
    else dotsSymbol = '░░';

    block.innerHTML = `
      <div class="month-bar">
        <span class="month-name">${month}</span>
        <span class="month-dots">${dotsSymbol}</span>
      </div>
    `;

    // Active pulse glow
    if (status === 'active') {
      const bar = block.querySelector('.month-bar');
      bar.style.position = 'relative';
    }

    container.appendChild(block);
  });
}

// ─── HUD Ring Inline SVG ───────────────────────────────────────────
function createHudRingSVG() {
  const container = $('hud-ring-svg-container');
  if (!container) return;

  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="position:absolute;inset:0">
      <defs>
        <filter id="g-cyan-hud" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b1"/>
          <feGaussianBlur stdDeviation="6" result="b2"/>
          <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="g-soft-hud" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="cg-hud" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="scan-hud" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00E5FF" stop-opacity="0"/>
          <stop offset="80%" stop-color="#00E5FF" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#00E5FF" stop-opacity="0.5"/>
        </linearGradient>
        <clipPath id="rc-hud"><circle cx="200" cy="200" r="175"/></clipPath>
      </defs>

      <circle cx="200" cy="200" r="175" fill="url(#cg-hud)"/>

      <!-- Outer ring -->
      <circle cx="200" cy="200" r="175" fill="none" stroke="#00E5FF" stroke-width="1" stroke-opacity="0.5" filter="url(#g-soft-hud)"/>
      <circle cx="200" cy="200" r="175" fill="none" stroke="#00E5FF" stroke-width="1.5" stroke-opacity="0.7" stroke-dasharray="6 6" filter="url(#g-cyan-hud)">
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="40s" repeatCount="indefinite"/>
      </circle>

      <!-- Tick marks -->
      ${generateTicks(200, 200, 175, 165, 60)}

      <!-- Scan sector -->
      <g clip-path="url(#rc-hud)">
        <path d="M200,200 L200,28 A172,172 0 0,1 341,286 Z" fill="url(#scan-hud)" opacity="0.35">
          <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="6s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Middle ring -->
      <circle cx="200" cy="200" r="140" fill="none" stroke="#00E5FF" stroke-width="0.5" stroke-opacity="0.2"/>

      <!-- Inner ring -->
      <circle cx="200" cy="200" r="108" fill="none" stroke="#00E5FF" stroke-width="0.8" stroke-opacity="0.4" filter="url(#g-soft-hud)"/>
      <circle cx="200" cy="200" r="108" fill="none" stroke="#8B5CFF" stroke-width="1.2" stroke-opacity="0.55" stroke-dasharray="16 20">
        <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="22s" repeatCount="indefinite"/>
      </circle>

      <!-- Crosshairs -->
      <line x1="200" y1="28" x2="200" y2="92" stroke="#00E5FF" stroke-width="1" stroke-opacity="0.45" filter="url(#g-soft-hud)"/>
      <line x1="200" y1="308" x2="200" y2="372" stroke="#00E5FF" stroke-width="1" stroke-opacity="0.45" filter="url(#g-soft-hud)"/>
      <line x1="28"  y1="200" x2="92"  y2="200" stroke="#00E5FF" stroke-width="1" stroke-opacity="0.45" filter="url(#g-soft-hud)"/>
      <line x1="308" y1="200" x2="372" y2="200" stroke="#00E5FF" stroke-width="1" stroke-opacity="0.45" filter="url(#g-soft-hud)"/>

      <!-- Diagonal guides -->
      <line x1="78"  y1="78"  x2="112" y2="112" stroke="#00E5FF" stroke-width="0.5" stroke-opacity="0.25"/>
      <line x1="322" y1="78"  x2="288" y2="112" stroke="#00E5FF" stroke-width="0.5" stroke-opacity="0.25"/>
      <line x1="78"  y1="322" x2="112" y2="288" stroke="#00E5FF" stroke-width="0.5" stroke-opacity="0.25"/>
      <line x1="322" y1="322" x2="288" y2="288" stroke="#00E5FF" stroke-width="0.5" stroke-opacity="0.25"/>

      <!-- Orbiting dots -->
      <circle cx="200" cy="28" r="3" fill="#00E5FF" filter="url(#g-cyan-hud)">
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="40s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="28" r="2.5" fill="#8B5CFF" filter="url(#g-cyan-hud)">
        <animateTransform attributeName="transform" type="rotate" from="120 200 200" to="480 200 200" dur="40s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="28" r="2" fill="#FFFFFF" opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from="240 200 200" to="600 200 200" dur="40s" repeatCount="indefinite"/>
      </circle>

      <!-- Center core -->
      <circle cx="200" cy="200" r="9" fill="none" stroke="#00E5FF" stroke-width="1.5" filter="url(#g-cyan-hud)">
        <animate attributeName="r" values="9;11;9" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="200" r="3" fill="#00E5FF" filter="url(#g-cyan-hud)">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}

function generateTicks(cx, cy, outerR, innerR, count) {
  let ticks = '';
  for (let i = 0; i < count; i++) {
    const angle = (i * 360 / count) * Math.PI / 180;
    const isMajor = i % 5 === 0;
    const r1 = outerR;
    const r2 = isMajor ? outerR - 12 : outerR - 6;
    const x1 = cx + Math.sin(angle) * r1;
    const y1 = cy - Math.cos(angle) * r1;
    const x2 = cx + Math.sin(angle) * r2;
    const y2 = cy - Math.cos(angle) * r2;
    const opacity = isMajor ? 0.5 : 0.25;
    const width = isMajor ? 1 : 0.5;
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#00E5FF" stroke-width="${width}" stroke-opacity="${opacity}"/>`;
  }
  return ticks;
}

// ─── Route animation ───────────────────────────────────────────────
function initRouteAnimation() {
  // Already handled via CSS animation .route-pulse
}

// ─── GPS / Geolocation ─────────────────────────────────────────────
function initGeolocation() {
  const gpsEl = $('gps-origin');
  if (!gpsEl) return;

  if (!navigator.geolocation) {
    gpsEl.textContent = `${CONFIG.ORIGIN.coord}`;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      gpsEl.textContent = `${lat}°N ${lon}°E`;

      // Recalculate distance from actual position
      const dist = haversine(pos.coords.latitude, pos.coords.longitude,
                             CONFIG.TARGET.lat, CONFIG.TARGET.lon);
      const distEl = $('route-distance');
      if (distEl) distEl.textContent = `${Math.round(dist)} KM`;
    },
    () => {
      gpsEl.textContent = CONFIG.ORIGIN.coord;
    },
    { timeout: 6000, maximumAge: 60000 }
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── Video Setup ───────────────────────────────────────────────────
function initVideo() {
  const video = $('bg-video');
  if (!video) return;

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.muted = true;

  const tryPlay = () => {
    video.play().catch(() => {
      // Autoplay blocked — set up user interaction listener
      document.addEventListener('touchstart', () => {
        video.play().catch(() => {});
      }, { once: true });
      document.addEventListener('click', () => {
        video.play().catch(() => {});
      }, { once: true });
    });
  };

  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('loadeddata', tryPlay, { once: true });
    video.addEventListener('canplay', tryPlay, { once: true });
  }
}

// ─── Splash Screen ─────────────────────────────────────────────────
function hideSplash() {
  const splash = $('splash');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('hidden');
  }, 1800);
}

// ─── PWA Service Worker ────────────────────────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => {
        console.log('[SIGNAL] SW registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[SIGNAL] SW registration failed:', err);
      });
  }
}

// ─── Tick Loop ─────────────────────────────────────────────────────
function tick() {
  updateClock();
  updateDaysLeft();
  updateDaysTogether();
}

// ─── Init ──────────────────────────────────────────────────────────
function init() {
  // Create inline HUD SVG
  createHudRingSVG();

  // Render timeline
  renderTimeline();

  // Initial data
  tick();

  // Start clock
  setInterval(updateClock, 1000);

  // Update day counters every minute
  setInterval(() => {
    updateDaysLeft();
    updateDaysTogether();
    renderTimeline();
  }, 60000);

  // Video
  initVideo();

  // GPS
  initGeolocation();

  // Hide splash
  hideSplash();

  // PWA
  registerServiceWorker();

  // Route animation
  initRouteAnimation();

  console.log('[SIGNAL] System initialized');
  console.log(`[SIGNAL] Days left: ${calcDaysLeft()}`);
  console.log(`[SIGNAL] Days together: ${calcDaysTogether()}`);
}

// ─── Boot ──────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
