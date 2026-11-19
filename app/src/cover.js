/* Leonida Cover Studio - cover.js
   Procedural GTA-style poster renderer. Everything is drawn with the
   Canvas 2D API: sky gradients, a glowing sun, a lit skyline, palm
   silhouettes, photo panels with white gutters, and bold caption
   lettering. No game artwork, no logo, no external font: only the
   system bold sans-serif stack. */

const GRADES = {
  sunset: {
    sky: ['#ff9a3c', '#ff5e78', '#7b2ff7'],
    sun: '#ffd23f',
    sunCore: '#fff3c4',
    skyline: '#2a0a4a',
    window: '#ffd23f',
    palm: '#1c0533',
    scrim: 'rgba(20, 4, 46, 0.55)'
  },
  neon: {
    sky: ['#ff2ea6', '#7b2ff7', '#00c2ff'],
    sun: '#00fff2',
    sunCore: '#d8fffb',
    skyline: '#0b1035',
    window: '#00fff2',
    palm: '#070b26',
    scrim: 'rgba(8, 4, 46, 0.55)'
  },
  noir: {
    sky: ['#24365e', '#101d3a', '#050914'],
    sun: '#dfe6ff',
    sunCore: '#ffffff',
    skyline: '#02040a',
    window: '#ffe9a8',
    palm: '#01020a',
    scrim: 'rgba(2, 4, 12, 0.6)'
  }
};

/* Layouts return panel rectangles as fractions of the cover size.
   Poster: one wide hero panel on top, two small panels below.
   Triptych: three tall vertical panels.
   Duo: two panels side by side. */
function layoutPanels(layout, width, height) {
  const gutter = Math.max(6, Math.round(width * 0.014));
  const frame = Math.max(8, Math.round(width * 0.016));
  const innerW = width - frame * 2;
  const innerH = height - frame * 2;
  if (layout === 'triptych') {
    const w = (innerW - gutter * 2) / 3;
    const list = [];
    for (let i = 0; i < 3; i++) {
      list.push({ x: frame + i * (w + gutter), y: frame, w: w, h: innerH });
    }
    return list;
  }
  if (layout === 'duo') {
    const w = (innerW - gutter) / 2;
    return [
      { x: frame, y: frame, w: w, h: innerH },
      { x: frame + w + gutter, y: frame, w: w, h: innerH }
    ];
  }
  const heroH = innerH * 0.60;
  const smallH = innerH - heroH - gutter;
  const smallW = (innerW - gutter) / 2;
  return [
    { x: frame, y: frame, w: innerW, h: heroH },
    { x: frame, y: frame + heroH + gutter, w: smallW, h: smallH },
    { x: frame + smallW + gutter, y: frame + heroH + gutter, w: smallW, h: smallH }
  ];
}

/* Sky gradient for one grade, top to bottom across the whole cover. */
function paintSky(ctx, grade, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

/* Sun disc with a soft halo, placed in the caption band. */
function paintSun(ctx, grade, cx, cy, radius) {
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 3.2);
  halo.addColorStop(0, grade.sun);
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = halo;
  ctx.fillRect(cx - radius * 3.2, cy - radius * 3.2, radius * 6.4, radius * 6.4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sunCore;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grade.sun;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* Deterministic pseudo-random helper so the skyline looks the same
   on every paint of the same cover size. */
function seededRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Dark building silhouettes with a few lit windows, along a baseline. */
function paintSkyline(ctx, grade, width, baseY, topY, seed) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = grade.skyline;
  let x = -10;
  while (x < width + 10) {
    const bw = width * (0.05 + rnd() * 0.07);
    const bh = (baseY - topY) * (0.35 + rnd() * 0.65);
    const by = baseY - bh;
    ctx.fillRect(x, by, bw, bh);
    if (rnd() > 0.45) {
      const aw = bw * 0.28;
      ctx.fillRect(x + bw * 0.36, by - bh * 0.28, aw, bh * 0.28);
    }
    ctx.fillStyle = grade.window;
    const cols = Math.max(1, Math.floor(bw / (width * 0.018)));
    const rows = Math.max(1, Math.floor(bh / (width * 0.022)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.62) {
          ctx.fillRect(
            x + width * 0.008 + c * (width * 0.018),
            by + width * 0.01 + r * (width * 0.022),
            width * 0.007,
            width * 0.009
          );
        }
      }
    }
    ctx.fillStyle = grade.skyline;
    x += bw + width * 0.012;
  }
}

/* One palm tree silhouette: a curved trunk and fronds that rise from
   the crown and droop at their tips. */
function paintPalm(ctx, color, baseX, baseY, size, lean) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = baseX + size * lean;
  const topY = baseY - size;
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + size * lean * 0.4, baseY - size * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const t = fronds === 1 ? 0.5 : i / (fronds - 1);
    const angle = -Math.PI * (0.12 + t * 0.76);
    const len = size * (0.42 + Math.sin(t * Math.PI) * 0.22);
    const tipX = topX + Math.cos(angle) * len;
    const tipY = topY + Math.sin(angle) * len * 0.55 + len * 0.34;
    const midX = topX + Math.cos(angle) * len * 0.5;
    const midY = topY + Math.sin(angle) * len * 0.5 - len * 0.22;
    ctx.lineWidth = Math.max(2, size * 0.02);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

/* A photo panel: cover-fit image with per-panel pan and zoom.
   When no image is set, a gradient placeholder with a palm is drawn. */
function paintPanel(ctx, rect, panel, grade, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const img = panel && panel.img ? panel.img : null;
  if (img && img.naturalWidth > 0) {
    const zoom = panel.zoom || 1;
    const panX = panel.panX || 0;
    const panY = panel.panY || 0;
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = rect.x + (rect.w - dw) / 2 + panX * rect.w;
    const dy = rect.y + (rect.h - dh) / 2 + panY * rect.h;
    ctx.drawImage(img, dx, dy, dw, dh);
    const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    tint.addColorStop(0, 'rgba(255, 94, 120, 0.10)');
    tint.addColorStop(1, 'rgba(123, 47, 247, 0.16)');
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, grade.sky[1]);
    g.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    paintPalm(ctx, grade.palm, rect.x + rect.w * 0.5, rect.y + rect.h, rect.h * 0.55, 0.12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '800 ' + Math.round(rect.h * 0.055) + 'px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.82);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/* Wrap an uppercased caption to lines that fit maxWidth at one size. */
function wrapCaption(ctx, text, size, maxWidth) {
  const words = String(text || '').toUpperCase().split(/\s+/).filter(function (w) { return w.length > 0; });
  ctx.font = '900 ' + size + 'px Arial, Helvetica, sans-serif';
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const trial = current ? current + ' ' + words[i] : words[i];
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push('LEONIDA');
  return lines;
}

/* Bold uppercase caption with a heavy outline and a drop shadow.
   topY is the top of the first line; lines are drawn below it. */
function paintCaption(ctx, lines, topY, size, color) {
  const font = '900 ' + size + 'px Arial, Helvetica, sans-serif';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  const lineHeight = size * 1.04;
  for (let i = 0; i < lines.length; i++) {
    const y = topY + size + i * lineHeight;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.round(size * 0.09);
    ctx.shadowOffsetY = Math.round(size * 0.06);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(3, size * 0.16);
    ctx.strokeText(lines[i], ctx.canvas.width / 2, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = color;
    ctx.fillText(lines[i], ctx.canvas.width / 2, y);
  }
  return lines.length;
}

/* Small spaced kicker line above the caption, e.g. LEONIDA. */
function paintKicker(ctx, text, cx, y, size, color) {
  const label = String(text || 'LEONIDA').toUpperCase();
  ctx.font = '800 ' + size + 'px Arial, Helvetica, sans-serif';
  try {
    ctx.letterSpacing = Math.round(size * 0.42) + 'px';
  } catch (err) {
    /* letterSpacing is optional; spacing falls back to plain text. */
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = Math.round(size * 0.25);
  ctx.shadowOffsetY = Math.round(size * 0.12);
  ctx.fillStyle = color;
  ctx.fillText(label, cx, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  try {
    ctx.letterSpacing = '0px';
  } catch (err) {
    /* reset is best effort only. */
  }
}

/* Fine film grain and a soft vignette over the whole cover. */
function paintFinish(ctx, width, height, seed) {
  const rnd = seededRandom(seed + 77);
  const dots = Math.floor((width * height) / 2600);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < dots; i++) {
    const x = rnd() * width;
    const y = rnd() * height;
    const r = 0.6 + rnd() * 1.4;
    ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

/* The main entry point. state:
     width, height      export size in pixels
     layout             'poster' | 'triptych' | 'duo'
     grade              'sunset' | 'neon' | 'noir'
     caption            caption text
     captionSize        caption font size in pixels (0 = auto)
     captionColor       caption fill colour
     kicker             small line above the caption
     panels             array of { img, zoom, panX, panY } per panel */
function drawCover(canvas, state) {
  const width = state.width || 1080;
  const height = state.height || 1080;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = state.layout || 'poster';
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  paintSky(ctx, grade, width, height);

  /* Caption band at the bottom: sky, sun, skyline and palms live here. */
  const bandH = Math.round(height * 0.24);
  const bandY = height - bandH;
  const scrim = ctx.createLinearGradient(0, bandY, 0, height);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(0.35, grade.scrim);
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, width, height);
  paintSun(ctx, grade, width * 0.86, bandY + bandH * 0.42, Math.round(width * 0.045));
  paintSkyline(ctx, grade, width, height, bandY + bandH * 0.30, width * 7 + height);
  paintPalm(ctx, grade.palm, width * 0.045, height - height * 0.008, height * 0.20, 0.22);
  paintPalm(ctx, grade.palm, width * 0.955, height - height * 0.008, height * 0.17, -0.22);

  /* Photo panels fill the area above the caption band, framed in white. */
  const frame = Math.max(8, Math.round(width * 0.016));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, bandY + frame);
  const rects = layoutPanels(layout, width, bandY);
  const panels = state.panels || [];
  for (let i = 0; i < rects.length; i++) {
    const own = panels[i];
    const panel = own && own.img ? own : (panels[0] || null);
    paintPanel(ctx, rects[i], panel, grade, width + i * 13);
  }

  /* Kicker + caption, sized to fit the band and centred in it. */
  const maxWidth = width * 0.88;
  let captionSize = state.captionSize || Math.round(width * 0.085);
  let lines = wrapCaption(ctx, state.caption || 'LEONIDA', captionSize, maxWidth);
  const blockHeight = function (size, count) {
    /* Kicker + gap + first line (cap height plus descender room) +
       each further line. */
    return Math.round(size * 0.26) + Math.round(size * 0.26 * 0.5) + size * 1.21 + (count - 1) * size * 1.04;
  };
  while (captionSize > 12 && blockHeight(captionSize, lines.length) > bandH * 0.94) {
    captionSize = Math.round(captionSize * 0.9);
    lines = wrapCaption(ctx, state.caption || 'LEONIDA', captionSize, maxWidth);
  }
  const kickerSize = Math.round(captionSize * 0.26);
  const gap = Math.round(kickerSize * 0.5);
  const total = kickerSize + gap + captionSize * 1.21 + (lines.length - 1) * captionSize * 1.04;
  const blockTop = bandY + (bandH - total) / 2;
  paintKicker(ctx, state.kicker || 'LEONIDA', width / 2, blockTop + kickerSize, kickerSize, '#ffd23f');
  paintCaption(ctx, lines, blockTop + kickerSize + gap, captionSize, state.captionColor || '#ffffff');

  paintFinish(ctx, width, height, width * 3 + height);
}
