import './style.css';
import { createCameraController } from './camera.js';

// Change this value to 2.0 during the live deployment demonstration.
const VERSION = '1.0';
const COMMIT = import.meta.env.VITE_COMMIT_SHA || 'local';

document.querySelector('#app').innerHTML = `
  <main>
    <h1>Camera Demo</h1>
    <p>Version <strong id="version"></strong></p>
    <div class="controls">
      <button id="start" type="button">Увімкнути камеру</button>
      <button id="stop" type="button" disabled>Зупинити</button>
    </div>
    <p id="status" role="status" aria-live="polite">Камера вимкнена</p>
    <video id="video" autoplay playsinline muted aria-label="Зображення з камери"></video>
    <p class="commit">Commit: <code id="commit"></code></p>
  </main>
`;

const video = document.querySelector('#video');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const status = document.querySelector('#status');
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
