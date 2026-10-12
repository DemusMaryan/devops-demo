import test from 'node:test';
import assert from 'node:assert/strict';
import { stopCamera, createCameraController } from '../src/camera.js';

function fixture() {
  const tracks = [new EventTarget(), new EventTarget()];
  for (const track of tracks) {
    track.stops = 0;
    track.readyState = 'live';
    track.stop = () => { track.stops++; track.readyState = 'ended'; };
  }
  const stream = { getTracks: () => tracks, getVideoTracks: () => tracks };
  const video = { srcObject: null, play: async () => {} };
  return { tracks, stream, video };
}

test('Stop releases every track and clears the video element', () => {
  const { video, stream, tracks } = fixture();
  video.srcObject = stream;
  stopCamera(video);
  assert.equal(video.srcObject, null);
  assert.deepEqual(tracks.map(t => t.stops), [1, 1]);
  stopCamera(video); // A second Stop is harmless.
  assert.deepEqual(tracks.map(t => t.stops), [1, 1]);
});

test('Start requests video only and changes the state to running', async () => {
  const { video, stream } = fixture();
  const states = [];
  let constraints;
  const camera = createCameraController({ video, getUserMedia: async options => { constraints = options; return stream; }, onState: ({ state }) => states.push(state) });
  await camera.start();
  assert.deepEqual(constraints, { video: true, audio: false });
  assert.equal(video.srcObject, stream);
  assert.deepEqual(states, ['requesting', 'running']);
  camera.stop();
  assert.equal(camera.state, 'idle');
});

test('Permission denial leaves the camera stopped and allows retry', async () => {
  const { video, stream } = fixture();
  const denied = new Error('denied'); denied.name = 'NotAllowedError';
  let attempts = 0;
  let reported;
  const camera = createCameraController({ video, getUserMedia: async () => { if (++attempts === 1) throw denied; return stream; }, onState: ({ error }) => { if (error) reported = error; } });
  await camera.start();
  assert.equal(camera.state, 'error');
  assert.equal(reported, denied);
  assert.equal(video.srcObject, null);
  await camera.start();
  assert.equal(camera.state, 'running');
  camera.stop();
});

test('Stop while permission is pending releases a stream that arrives later', async () => {
  const { video, stream, tracks } = fixture();
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const camera = createCameraController({ video, getUserMedia: () => pending });
  const starting = camera.start();
  camera.stop();
  resolve(stream);
  await starting;
  assert.equal(camera.state, 'idle');
  assert.equal(video.srcObject, null);
  assert.deepEqual(tracks.map(t => t.stops), [1, 1]);
});

test('Repeated Start does not request a second camera stream', async () => {
  const { video, stream } = fixture();
  let calls = 0;
  const camera = createCameraController({ video, getUserMedia: async () => { calls++; return stream; } });
  await Promise.all([camera.start(), camera.start()]);
  await camera.start();
  assert.equal(calls, 1);
  camera.stop();
});

test('Playback failure releases acquired tracks', async () => {
  const { video, stream, tracks } = fixture();
  video.play = async () => { throw new Error('playback failed'); };
  const camera = createCameraController({ video, getUserMedia: async () => stream });
  await camera.start();
  assert.equal(camera.state, 'error');
  assert.equal(video.srcObject, null);
  assert.deepEqual(tracks.map(t => t.stops), [1, 1]);
});

test('Camera disconnection returns the controller to idle', async () => {
  const { video, stream, tracks } = fixture();
  const camera = createCameraController({ video, getUserMedia: async () => stream });
  await camera.start();
  tracks.forEach(t => { t.readyState = 'ended'; });
  tracks[0].dispatchEvent(new Event('ended'));
  assert.equal(camera.state, 'idle');
  assert.equal(video.srcObject, null);
});
