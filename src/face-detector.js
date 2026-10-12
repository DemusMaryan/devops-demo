export async function loadFaceDetector() {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const assets = new URL('vision/', document.baseURI);
  const files = await FilesetResolver.forVisionTasks(new URL('wasm', assets).href);
  return FaceDetector.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: new URL('models/blazeface-short-range.tflite', assets).href,
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.5,
  });
}

export function drawFaceBoxes(context, detections, width, height) {
  context.clearRect(0, 0, width, height);
  context.strokeStyle = '#00e676';
  context.lineWidth = Math.max(2, width / 300);
  for (const { boundingBox: box } of detections) {
    if (!box) continue;
    const left = Math.max(0, box.originX);
    const top = Math.max(0, box.originY);
    const right = Math.min(width, box.originX + box.width);
    const bottom = Math.min(height, box.originY + box.height);
    if (right > left && bottom > top) context.strokeRect(left, top, right - left, bottom - top);
  }
}

export function createFaceOverlay({
  video, canvas, loadDetector = loadFaceDetector,
  requestFrame = callback => requestAnimationFrame(callback),
  cancelFrame = id => cancelAnimationFrame(id),
  onLoading = () => {}, onResult = () => {}, onError = () => {},
}) {
  const context = canvas.getContext('2d');
  let detector;
  let loading;
  let generation = 0;
  let frame = null;
  let lastTime = -1;
  let lastTimestamp = -Infinity;
  let disposed = false;

  function stop() {
    generation++;
    if (frame !== null) cancelFrame(frame);
    frame = null;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function start() {
    stop();
    const current = generation;
    onLoading();
    try {
      loading ??= Promise.resolve().then(loadDetector).then(result => {
        detector = result;
        if (disposed) detector.close();
        return result;
      }).catch(error => { loading = null; throw error; });
      await loading;
      if (disposed || current !== generation) return;
      lastTime = -1;
      lastTimestamp = -Infinity;

      function tick(timestamp) {
        if (disposed || current !== generation) return;
        try {
          if (video.readyState >= 2 && video.videoWidth > 0 &&
              video.currentTime !== lastTime && timestamp - lastTimestamp >= 100) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.parentElement.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
            }
            const { detections } = detector.detectForVideo(video, timestamp);
            drawFaceBoxes(context, detections, canvas.width, canvas.height);
            lastTime = video.currentTime;
            lastTimestamp = timestamp;
            onResult(detections.length);
          }
          frame = requestFrame(tick);
        } catch (error) { stop(); onError(error); }
      }
      frame = requestFrame(tick);
    } catch (error) {
      if (!disposed && current === generation) { stop(); onError(error); }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    detector?.close();
  }

  return { start, stop, dispose };
}
