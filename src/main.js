import './style.css';
import { createCameraController } from './camera.js';

// Change this value to 2.0 during the live deployment demonstration.
const VERSION = '1.0';
const COMMIT = import.meta.env.VITE_COMMIT_SHA || 'local';

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="./">Camera Demo<span>GitHub Actions</span></a>
    <div class="release">Version <strong id="version"></strong></div>
  </header>
  <main>
    <section class="intro">
      <p class="eyebrow">ПРАКТИЧНА ДЕМОНСТРАЦІЯ CI/CD</p>
      <h1>Нова версія.<br>Та сама камера.</h1>
      <p class="description">Увімкни камеру, перевір зображення й порівняй версію застосунку після deployment.</p>
      <div class="controls">
        <button id="start" type="button">Увімкнути камеру</button>
        <button id="stop" type="button" class="secondary" disabled>Зупинити</button>
      </div>
      <p id="status" role="status" aria-live="polite">Камера вимкнена</p>
      <p class="privacy">Відео залишається у твоєму браузері. Застосунок його не записує.</p>
    </section>
    <section class="camera" aria-label="Відео з камери">
      <div class="camera-heading"><span id="indicator"></span><span id="camera-label">Камера вимкнена</span></div>
      <div class="viewport">
        <video id="video" autoplay playsinline muted aria-label="Зображення з камери"></video>
        <div id="placeholder"><span class="camera-icon" aria-hidden="true">◉</span><p>Тут з’явиться відео</p><small>Натисни «Увімкнути камеру»</small></div>
      </div>
    </section>
  </main>
  <footer><span>Vite + GitHub Actions + GitHub Pages</span><span>Commit: <code id="commit"></code></span></footer>
`;

const video = document.querySelector('#video');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const status = document.querySelector('#status');
const placeholder = document.querySelector('#placeholder');
const indicator = document.querySelector('#indicator');
const cameraLabel = document.querySelector('#camera-label');
document.querySelector('#version').textContent = VERSION;
document.querySelector('#commit').textContent = COMMIT === 'local' ? COMMIT : COMMIT.slice(0, 7);
document.querySelector('#commit').title = COMMIT;

function errorMessage(error) {
  const messages = {
    NotAllowedError: 'Доступ до камери заборонено. Дозволь його в налаштуваннях браузера й спробуй знову.',
    NotFoundError: 'Камеру не знайдено. Під’єднай її й спробуй знову.',
    NotReadableError: 'Не вдалося відкрити камеру. Перевір, чи не використовує її інший застосунок.',
    SecurityError: 'Браузер обмежив доступ до камери. Перевір дозволи та захищене з’єднання.',
  };
  return messages[error?.name] || 'Не вдалося запустити камеру. Перевір пристрій і дозволи браузера.';
}

const controller = createCameraController({
  video,
  getUserMedia: constraints => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API unavailable');
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  },
  onState: ({ state, error }) => {
    const labels = { idle: 'Камера вимкнена', requesting: 'Очікуємо дозвіл на камеру…', running: 'Камера працює', error: 'Камера недоступна' };
    start.disabled = state === 'requesting' || state === 'running';
    stop.disabled = state !== 'requesting' && state !== 'running';
    placeholder.hidden = state === 'running';
    indicator.classList.toggle('active', state === 'running');
    cameraLabel.textContent = labels[state];
    status.classList.toggle('error', state === 'error');
    status.textContent = state === 'error' ? errorMessage(error) : labels[state];
  },
});

if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
  start.disabled = true;
  status.textContent = 'Для камери відкрий сайт через HTTPS або localhost у браузері з підтримкою getUserMedia.';
  status.classList.add('error');
}

start.addEventListener('click', () => controller.start());
stop.addEventListener('click', () => controller.stop());
window.addEventListener('pagehide', () => controller.stop());
