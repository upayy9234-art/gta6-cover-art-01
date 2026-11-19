/* Leonida Cover Studio - main.js
   Editor wiring: photo upload and samples, panel picking, drag to pan,
   wheel or slider to zoom, caption and grade controls, export sizes,
   and PNG export. The cover itself is painted by drawCover in
   cover.js; this file only owns the UI state around it. */

const EXPORT_SIZES = {
  '1080x1080': { width: 1080, height: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { width: 1080, height: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { width: 1920, height: 1080, label: 'Landscape 1920 x 1080' }
};

const SAMPLE_PHOTOS = {
  pier: 'samples/pier.jpg',
  boulevard: 'samples/boulevard.jpg'
};

const CAPTION_COLORS = ['#ffffff', '#ffd23f', '#ff5da2', '#39d5ff', '#ff7a3c'];

const PANEL_COUNTS = { poster: 3, triptych: 3, duo: 2 };

const state = {
  width: 1920,
  height: 1080,
  sizeKey: '1920x1080',
  layout: 'poster',
  grade: 'sunset',
  caption: 'Sunset Heist',
  captionSize: 0,
  captionColor: '#ffffff',
  kicker: 'LEONIDA',
  panels: [],
  activePanel: 0
};

let canvas = null;
let statusLine = null;
let redrawTimer = 0;

/* Keep the panel list the right length for the layout, reusing the
   first photo for empty slots so every panel always shows something. */
function ensurePanels() {
  const count = PANEL_COUNTS[state.layout] || 3;
  while (state.panels.length < count) {
    state.panels.push({ img: null, zoom: 1, panX: 0, panY: 0 });
  }
  state.panels.length = count;
  if (state.activePanel >= count) state.activePanel = 0;
}

function currentSize() {
  return { width: state.width, height: state.height };
}

function drawState() {
  ensurePanels();
  const size = currentSize();
  const captionSize = state.captionSize || Math.round(size.width * 0.085);
  drawCover(canvas, {
    width: size.width,
    height: size.height,
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    captionSize: captionSize,
    captionColor: state.captionColor,
    kicker: state.kicker,
    panels: state.panels
  });
}

function scheduleDraw() {
  if (redrawTimer) return;
  redrawTimer = requestAnimationFrame(function () {
    redrawTimer = 0;
    drawState();
  });
}

function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('Could not load ' + src)); };
    img.src = src;
  });
}

/* Read a local file into an image without uploading it anywhere. */
function loadFileImage(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Could not read ' + file.name)); };
      img.src = String(reader.result);
    };
    reader.onerror = function () { reject(new Error('Could not read ' + file.name)); };
    reader.readAsDataURL(file);
  });
}

function applyPhotoToPanel(img, index) {
  ensurePanels();
  const target = index === undefined ? state.activePanel : index;
  state.panels[target] = { img: img, zoom: 1, panX: 0, panY: 0 };
  scheduleDraw();
  setStatus('Photo loaded into panel ' + (target + 1) + '. Drag it to position, scroll to zoom.');
}

function loadSample(name) {
  const src = SAMPLE_PHOTOS[name];
  if (!src) return Promise.resolve(null);
  return loadImage(src).then(function (img) {
    applyPhotoToPanel(img, 0);
    if (state.panels.length > 1 && !state.panels[1].img) {
      applyPhotoToPanel(img, 1);
    }
    return img;
  }).catch(function (err) {
    setStatus(err.message);
    return null;
  });
}

function setCaptionText(text) {
  state.caption = text;
  scheduleDraw();
}

function setLayout(layout) {
  if (!PANEL_COUNTS[layout]) return;
  state.layout = layout;
  ensurePanels();
  syncPanelButtons();
  scheduleDraw();
  setStatus('Layout: ' + layout + '. ' + PANEL_COUNTS[layout] + ' panels.');
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  scheduleDraw();
  setStatus('Grade: ' + grade + '.');
}

function setExportSize(key) {
  const size = EXPORT_SIZES[key];
  if (!size) return;
  state.sizeKey = key;
  state.width = size.width;
  state.height = size.height;
  scheduleDraw();
  setStatus('Export size: ' + size.label + '.');
}

function setCaptionColor(color) {
  state.captionColor = color;
  scheduleDraw();
}

function setCaptionSizeScale(scale) {
  const base = Math.round(state.width * 0.085);
  state.captionSize = Math.round(base * scale);
  scheduleDraw();
}

function setActivePanel(index) {
  ensurePanels();
  if (index < 0 || index >= state.panels.length) return;
  state.activePanel = index;
  syncPanelButtons();
  syncZoomControls();
  setStatus('Panel ' + (index + 1) + ' selected. Drag to pan, scroll to zoom.');
}

function syncPanelButtons() {
  const buttons = document.querySelectorAll('[data-panel]');
  buttons.forEach(function (button) {
    const index = Number(button.getAttribute('data-panel'));
    button.classList.toggle('active', index === state.activePanel);
    button.disabled = index >= (PANEL_COUNTS[state.layout] || 3);
  });
}

function syncZoomControls() {
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('pan-x');
  const panY = document.getElementById('pan-y');
  const panel = state.panels[state.activePanel];
  if (!panel) return;
  if (zoom) zoom.value = String(panel.zoom);
  const zoomValue = document.getElementById('zoom-value');
  if (zoomValue) zoomValue.textContent = panel.zoom.toFixed(2) + 'x';
  if (panX) panX.value = String(panel.panX);
  if (panY) panY.value = String(panel.panY);
}

function exportPng() {
  drawState();
  const size = currentSize();
  canvas.toBlob(function (blob) {
    if (!blob) {
      setStatus('Export failed: the browser could not make the PNG.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leonida-cover-' + size.width + 'x' + size.height + '.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    setStatus('Exported leonida-cover-' + size.width + 'x' + size.height + '.png (' + blob.size + ' bytes).');
  }, 'image/png');
}

/* Pointer position on the canvas, in canvas pixels. */
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

/* Which panel rectangle holds a canvas point, or -1. */
function panelAt(point) {
  const rects = layoutPanels(state.layout, state.width, state.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

function bindCanvas() {
  let dragging = false;
  let last = null;
  canvas.addEventListener('pointerdown', function (event) {
    const point = canvasPoint(event);
    const index = panelAt(point);
    if (index === -1) return;
    setActivePanel(index);
    dragging = true;
    last = point;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!dragging || !last) return;
    const point = canvasPoint(event);
    const panel = state.panels[state.activePanel];
    if (!panel) return;
    panel.panX += (point.x - last.x) / state.width;
    panel.panY += (point.y - last.y) / state.height;
    panel.panX = Math.max(-0.6, Math.min(0.6, panel.panX));
    panel.panY = Math.max(-0.6, Math.min(0.6, panel.panY));
    last = point;
    syncZoomControls();
    scheduleDraw();
  });
  function endDrag() {
    dragging = false;
    last = null;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    const panel = state.panels[state.activePanel];
    if (!panel) return;
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    panel.zoom = Math.max(1, Math.min(4, panel.zoom * factor));
    syncZoomControls();
    scheduleDraw();
  }, { passive: false });
}

function bindControls() {
  const fileInput = document.getElementById('photo-input');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const files = Array.prototype.slice.call(fileInput.files || []);
      if (files.length === 0) return;
      const jobs = files.slice(0, 3).map(function (file) { return loadFileImage(file); });
      Promise.all(jobs).then(function (images) {
        images.forEach(function (img, i) { applyPhotoToPanel(img, i); });
        setStatus(files.length + ' photo(s) loaded. Pick a panel, then drag to position it.');
      }).catch(function (err) {
        setStatus(err.message);
      });
      fileInput.value = '';
    });
  }

  document.querySelectorAll('[data-sample]').forEach(function (button) {
    button.addEventListener('click', function () {
      loadSample(button.getAttribute('data-sample'));
    });
  });
  document.querySelectorAll('[data-layout]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-layout]').forEach(function (b) {
        b.classList.toggle('active', b === button);
      });
      setLayout(button.getAttribute('data-layout'));
    });
  });
  document.querySelectorAll('[data-grade]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-grade]').forEach(function (b) {
        b.classList.toggle('active', b === button);
      });
      setGrade(button.getAttribute('data-grade'));
    });
  });
  document.querySelectorAll('[data-panel]').forEach(function (button) {
    button.addEventListener('click', function () {
      setActivePanel(Number(button.getAttribute('data-panel')));
    });
  });

  const sizeSelect = document.getElementById('export-size');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', function () { setExportSize(sizeSelect.value); });
  }
  const captionInput = document.getElementById('caption');
  if (captionInput) {
    captionInput.addEventListener('input', function () { setCaptionText(captionInput.value); });
  }
  const captionSize = document.getElementById('caption-size');
  if (captionSize) {
    captionSize.addEventListener('input', function () {
      setCaptionSizeScale(Number(captionSize.value));
    });
  }
  document.querySelectorAll('[data-color]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-color]').forEach(function (b) {
        b.classList.toggle('active', b === button);
      });
      setCaptionColor(button.getAttribute('data-color'));
    });
  });
  const zoom = document.getElementById('zoom');
  if (zoom) {
    zoom.addEventListener('input', function () {
      const panel = state.panels[state.activePanel];
      if (!panel) return;
      panel.zoom = Number(zoom.value);
      scheduleDraw();
    });
  }
  const panX = document.getElementById('pan-x');
  if (panX) {
    panX.addEventListener('input', function () {
      const panel = state.panels[state.activePanel];
      if (!panel) return;
      panel.panX = Number(panX.value);
      scheduleDraw();
    });
  }
  const panY = document.getElementById('pan-y');
  if (panY) {
    panY.addEventListener('input', function () {
      const panel = state.panels[state.activePanel];
      if (!panel) return;
      panel.panY = Number(panY.value);
      scheduleDraw();
    });
  }
  const reset = document.getElementById('reset-panel');
  if (reset) {
    reset.addEventListener('click', function () {
      const panel = state.panels[state.activePanel];
      if (!panel) return;
      panel.zoom = 1;
      panel.panX = 0;
      panel.panY = 0;
      syncZoomControls();
      scheduleDraw();
      setStatus('Panel ' + (state.activePanel + 1) + ' reset.');
    });
  }
  const exportButton = document.getElementById('export-png');
  if (exportButton) {
    exportButton.addEventListener('click', exportPng);
  }
}

/* Public handle for shots.js and for debugging from the console. */
window.Leonida = {
  state: state,
  draw: drawState,
  loadSample: loadSample,
  loadImage: loadImage,
  setCaption: setCaptionText,
  setLayout: setLayout,
  setGrade: setGrade,
  setExportSize: setExportSize,
  applyPhoto: applyPhotoToPanel,
  setStatus: setStatus,
  sizes: EXPORT_SIZES,
  samples: SAMPLE_PHOTOS,
  colors: CAPTION_COLORS
};

function init() {
  canvas = document.getElementById('stage');
  statusLine = document.getElementById('status');
  if (!canvas) return;
  ensurePanels();
  bindCanvas();
  bindControls();
  syncPanelButtons();
  syncZoomControls();
  setStatus('Ready. Load a photo, pick a layout, write a caption, export a PNG.');
  const inShotMode = new URLSearchParams(window.location.search).has('shot');
  if (!inShotMode) {
    loadSample('pier');
  }
  drawState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
