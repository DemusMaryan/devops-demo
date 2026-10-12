import test from 'node:test';
import assert from 'node:assert/strict';
import { createFaceOverlay, drawFaceBoxes } from '../src/face-detector.js';

function fixture() {
  const rectangles = [];
  let clears = 0;
  const context = { clearRect: () => clears++, strokeRect: (...box) => rectangles.push(box) };
  const canvas = { width: 0, height: 0, parentElement: { style: {} }, getContext: () => context };
  const video = { readyState: 2, videoWidth: 640, videoHeight: 480, currentTime: 1 };
  const callbacks = new Map();
  let next = 0;
  return { context, canvas, video, rectangles, get clears() { return clears; },
    requestFrame: cb => { callbacks.set(++next, cb); return next; },
    cancelFrame: id => callbacks.delete(id),
    runFrame: time => { const [id, cb] = callbacks.entries().next().value; callbacks.delete(id); cb(time); },
    callbacks,
  };
}

test('Face boxes are clipped to the image bounds', () => {
  const f = fixture();
  drawFaceBoxes(f.context, [{ boundingBox: { originX: -10, originY: 20, width: 50, height: 500 } }], 640, 480);
  assert.deepEqual(f.rectangles, [[0, 20, 40, 460]]);
  assert.equal(f.clears, 1);
});

test('Stop during model loading does not start inference later', async () => {
  const f = fixture();
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const overlay = createFaceOverlay({ ...f, loadDetector: () => pending });
  const starting = overlay.start();
  overlay.stop();
  resolve({ close() {} });
  await starting;
  assert.equal(f.callbacks.size, 0);
});

test('Disposal releases a model that finishes loading later', async () => {
  const f = fixture();
  let resolve, closed = 0;
  const pending = new Promise(r => { resolve = r; });
  const overlay = createFaceOverlay({ ...f, loadDetector: () => pending });
  const starting = overlay.start();
  overlay.dispose();
  resolve({ close: () => closed++ });
  await starting;
  assert.equal(closed, 1);
  assert.equal(f.callbacks.size, 0);
});

test('A failed model load reports an error and allows retry', async () => {
  const f = fixture();
  let calls = 0, errors = 0;
  const overlay = createFaceOverlay({ ...f, loadDetector: async () => {
    if (++calls === 1) throw new Error('download failed');
    return { close() {} };
  }, onError: () => errors++ });
  await overlay.start();
  assert.equal(errors, 1);
  assert.equal(f.callbacks.size, 0);
  await overlay.start();
  assert.equal(calls, 2);
  assert.equal(f.callbacks.size, 1);
  overlay.dispose();
});

test('Inference skips duplicate frames and stops when the camera stops', async () => {
  const f = fixture();
  let detections = 0;
  const overlay = createFaceOverlay({ ...f, loadDetector: async () => ({
    detectForVideo: () => { detections++; return { detections: [] }; }, close() {},
  }) });
  await overlay.start();
  f.runFrame(100);
  f.runFrame(250); // Same video frame.
  assert.equal(detections, 1);
  f.video.currentTime = 2;
  f.runFrame(300);
  assert.equal(detections, 2);
  assert.equal(f.canvas.width, 640);
  assert.equal(f.canvas.parentElement.style.aspectRatio, '640 / 480');
  overlay.stop();
  assert.equal(f.callbacks.size, 0);
  overlay.dispose();
});
