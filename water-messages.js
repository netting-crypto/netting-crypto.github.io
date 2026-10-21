import * as THREE from './assets/three.module.js';

// Text is a mask in world coordinates, so the water refracts its shadow.
// These are portfolio themes, not messages attributed to visitors.
const lines = ['让好想法浮出水面', '从真实问题出发', 'Graph AI Workspace', '把 AI 做成用得上的产品', 'ScholarPulse'];
export function createWaterMessages(uniforms) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = lines.length * 128;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const entries = [];
  function paint() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '700 64px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textBaseline = 'middle';
    entries.length = 0;
    for (let i = 0; i < lines.length; i++) {
      const width = Math.min(1008, Math.ceil(context.measureText(lines[i]).width) + 48);
      context.save();
      context.beginPath();
      context.rect(0, i * 128, 1024, 128);
      context.clip();
      context.fillStyle = '#fff';
      context.shadowColor = '#fff';
      context.shadowBlur = 4;
      context.fillText(lines[i], 24, i * 128 + 64, width - 48);
      context.restore();
      entries.push({ halfWidth: width / 64 * .22 / 2, uv: new THREE.Vector4(0, 1 - (i + 1) / lines.length, width / 1024, 1 / lines.length) });
    }
    texture.needsUpdate = true;
  }
  paint();
  document.fonts?.ready.then(paint);
  uniforms.messageMap.value.dispose();
  uniforms.messageMap.value = texture;
  const lanes = [-.60, .55, .10];
  return {
    update(time, halfPool, reducedMotion) {
      const count = innerWidth < 600 ? 2 : 3;
      for (let i = 0; i < 3; i++) {
        const elapsed = time - 2.8 - i * 4.3;
        const active = !reducedMotion && i < count && elapsed >= 0;
        if (!active) { uniforms.messageFade.value[i] = 0; continue; }
        const cycle = Math.floor(elapsed / 18), phase = (elapsed % 18) / 18;
        const entry = entries[(cycle * 3 + i) % entries.length];
        const span = halfPool.x + entry.halfWidth + .35;
        uniforms.messageRect.value[i].set(span * (1 - 2 * phase), halfPool.y * lanes[i], entry.halfWidth, .22);
        uniforms.messageUV.value[i].copy(entry.uv);
        uniforms.messageFade.value[i] = Math.min(1, phase * 16, (1 - phase) * 16) * .78;
      }
    }
  };
}
