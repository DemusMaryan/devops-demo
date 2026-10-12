import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/vision');
const model = path.join(output, 'models/blazeface-short-range.tflite');
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const modelHash = 'b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

await fs.mkdir(path.dirname(model), { recursive: true });
await fs.cp(path.join(root, 'node_modules/@mediapipe/tasks-vision/wasm'), path.join(output, 'wasm'), { recursive: true });
let cached = false;
try { cached = digest(await fs.readFile(model)) === modelHash; } catch {}
if (!cached) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(modelUrl, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Model download: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== modelHash) throw new Error('Face model checksum mismatch');
      await fs.writeFile(model, bytes);
      lastError = null;
      break;
    } catch (error) { lastError = error; }
  }
  if (lastError) throw lastError;
}
console.log('Face detector assets ready.');
