// Draws a shareable "My attendance" image. Only the first name is included — no roll number or other data.
import { ATTENDANCE_TARGET } from '../config/env.js';
import { statusMeta } from './status.js';

const W = 1080;
const H = 1350;

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawShareCard({ firstName, percentage, status, advice }) {
  await document.fonts?.ready;
  const font = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
  const meta = statusMeta(status);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background + aurora
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  const blob = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  blob(120, 80, 700, 'rgba(0,255,102,0.22)');
  blob(1000, 260, 600, 'rgba(0,255,102,0.12)');
  blob(560, 1350, 700, 'rgba(0,255,102,0.14)');

  // Brand
  ctx.fillStyle = '#00ff66';
  ctx.font = `800 52px ${font}`;
  ctx.fillText('Safe', 90, 140);
  const safeW = ctx.measureText('Safe').width;
  const brand = ctx.createLinearGradient(90 + safeW, 0, 90 + safeW + 70, 0);
  brand.addColorStop(0, '#00ff66');
  brand.addColorStop(1, '#96ffbe');
  ctx.fillStyle = brand;
  ctx.fillText('75', 90 + safeW, 140);

  ctx.fillStyle = 'rgba(120,255,170,0.7)';
  ctx.font = `600 40px ${font}`;
  ctx.fillText(`${firstName ? `${firstName}'s` : 'My'} attendance`, 90, 250);

  // Ring
  const cx = W / 2;
  const cy = 640;
  const r = 270;
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,255,102,0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, meta.hex);
  ring.addColorStop(1, meta.hex2);
  ctx.strokeStyle = ring;
  ctx.shadowColor = meta.hex;
  ctx.shadowBlur = 50;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.min(100, percentage) / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ff66';
  ctx.font = `800 150px ${font}`;
  ctx.fillText(`${percentage.toFixed(1)}%`, cx, cy + 40);
  ctx.fillStyle = meta.hex;
  ctx.font = `700 46px ${font}`;
  ctx.fillText(meta.headline, cx, cy + 115);

  // Advice
  ctx.fillStyle = 'rgba(120,255,170,0.85)';
  ctx.font = `600 42px ${font}`;
  wrap(ctx, advice, W - 220).slice(0, 3).forEach((line, i) => ctx.fillText(line, cx, 1060 + i * 58));

  ctx.fillStyle = 'rgba(120,255,170,0.45)';
  ctx.font = `500 30px ${font}`;
  ctx.fillText(`Staying above ${ATTENDANCE_TARGET}% with Safe75`, cx, H - 80);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Shares the card with the native share sheet, or downloads it. */
export async function shareAttendanceCard(opts) {
  const blob = await drawShareCard(opts);
  if (!blob) throw new Error('Could not create the image');
  const file = new File([blob], 'safe75-attendance.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My attendance' });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'safe75-attendance.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
