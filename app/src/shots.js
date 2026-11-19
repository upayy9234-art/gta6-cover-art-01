/* Leonida Cover Studio - shots.js
   Screenshot modes, driven by the query string:
     ?shot=cover   cover only, fullscreen, controls hidden
     ?shot=editor  the full editor with a sample photo loaded
   Extra parameters: photo=pier|boulevard, caption=<text>,
   layout=poster|triptych|duo, grade=sunset|neon|noir,
   size=1080x1080|1080x1350|1920x1080.
   After the cover is painted, window.__shotReady is set so a
   headless browser knows the frame is ready to capture. */

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  const out = {};
  params.forEach(function (value, key) {
    out[key] = value;
  });
  return out;
}

function markReady() {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      window.__shotReady = true;
    });
  });
}

function applyShotOptions(query) {
  const app = window.Leonida;
  if (!app) return;
  if (query.layout) app.setLayout(query.layout);
  if (query.grade) app.setGrade(query.grade);
  if (query.size) app.setExportSize(query.size);
  if (query.caption) {
    app.setCaption(query.caption);
    const input = document.getElementById('caption');
    if (input) input.value = query.caption;
  }
}

function showCoverOnly() {
  document.body.classList.add('shot-cover');
  const canvas = document.getElementById('stage');
  if (!canvas) return;
  const app = window.Leonida;
  const width = window.innerWidth;
  const height = window.innerHeight;
  app.state.width = width;
  app.state.height = height;
  app.state.captionSize = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  app.draw();
}

function showEditor() {
  document.body.classList.add('shot-editor');
  const app = window.Leonida;
  app.draw();
}

function runShot(shot, query, load) {
  const app = window.Leonida;
  if (!app) {
    markReady();
    return;
  }
  applyShotOptions(query);
  const photoName = query.photo || 'pier';
  const photo = load(photoName);
  photo.then(function (img) {
    if (img) {
      app.applyPhoto(img, 0);
      if (app.state.panels.length > 1 && !app.state.panels[1].img) {
        app.applyPhoto(img, 1);
      }
    }
    if (shot === 'cover') {
      showCoverOnly();
    } else {
      showEditor();
    }
    markReady();
  }).catch(function () {
    if (shot === 'cover') {
      showCoverOnly();
    } else {
      showEditor();
    }
    markReady();
  });
}

window.runShot = runShot;

function bootShots() {
  const query = readQuery();
  const shot = query.shot;
  if (!shot) return;
  /* Load the raw image file directly: loadSample would also apply
     it to panels and race the editor's own default sample load. */
  const load = function (name) {
    const src = window.Leonida.samples[name] || window.Leonida.samples.pier;
    return window.Leonida.loadImage(src);
  };
  runShot(shot, query, load);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootShots);
} else {
  bootShots();
}
