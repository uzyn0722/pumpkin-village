import { SPRITES } from './sprites.js';

const DEFS = SPRITES.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function svgImage(inner, w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${inner}</svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
const use = (id, x, y, w, h, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})"><use href="#${id}" xlink:href="#${id}" width="${w}" height="${h}"/></g>`;

function basketSvg(style) {
  return `${use('ck3', 58, 66, 64, 55, -18)}${use('ck2', 116, 56, 62, 54, 14)}${use('ck1', 88, 78, 70, 60)}
  ${use(`pk${style}`, 8, 96, 224, 188)}`;
}

function fitSize(ctx, text, max, start, font) {
  let s = start;
  while (s > 30) { ctx.font = font(s); if (ctx.measureText(text).width <= max) break; s -= 4; }
  return s;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

const DISPLAY = (z) => `${z}px "Black Han Sans", sans-serif`;
const BODY = (w, z) => `${w} ${z}px "Noto Sans KR", sans-serif`;

function logo(ctx, text, x, y, size) {
  ctx.font = DISPLAY(size); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.fillStyle = '#0D0820'; ctx.strokeStyle = '#0D0820'; ctx.lineWidth = size * 0.28;
  ctx.strokeText(text, x, y + size * 0.07);
  ctx.strokeStyle = '#2B7BE4'; ctx.lineWidth = size * 0.28; ctx.strokeText(text, x, y);
  ctx.fillStyle = '#FF6FAE'; ctx.fillText(text, x, y);
}

// kind: 'invite' | 'result'
export async function makeStory({ kind, name, count, style = 1, openText, url }) {
  try { await Promise.all([document.fonts.load('80px "Black Han Sans"'), document.fonts.load('60px Shrikhand'), document.fonts.load('700 40px "Noto Sans KR"')]); } catch { /* fallback fonts */ }
  const W = 1080; const H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // night sky
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#160E28'); g.addColorStop(1, '#241638');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,243,230,.35)';
  for (let i = 0; i < 40; i++) { const x = (i * 397) % W; const y = (i * 769) % 1100; const r = (i % 3) * 0.8 + 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // brand
  ctx.textAlign = 'center';
  ctx.font = '54px Shrikhand, serif'; ctx.fillStyle = '#FFC93C'; ctx.fillText('Halloween', W / 2, 180);
  logo(ctx, '호박마을', W / 2, 286, 92);

  // headline
  const fit = (text, max, start, f) => fitSize(ctx, text, max, start, f);
  const who = kind === 'result' ? `${name}의 할로윈 사탕 바구니` : `${name}의`;
  ctx.fillStyle = '#FFF3E6'; ctx.font = BODY(700, fit(who, W - 200, 54, (z) => BODY(700, z))); ctx.fillText(who, W / 2, 450);
  const head = kind === 'result' ? `사탕 ${count}개 받았어요` : '할로윈 사탕 바구니';
  ctx.fillStyle = '#FFD84A'; ctx.font = DISPLAY(fit(head, W - 160, 112, DISPLAY)); ctx.fillText(head, W / 2, 576);

  // rainbow + basket (same stage as the app)
  const cx = W / 2; const base = 1220; const band = 36;
  ['#FF4B3E', '#FF8A2E', '#FFC93C', '#3FBF6A', '#2B7BE4'].forEach((col, i) => {
    ctx.beginPath(); ctx.arc(cx, base, 470 - i * band, Math.PI, 0); ctx.lineWidth = band + 1; ctx.strokeStyle = col; ctx.stroke();
  });
  ctx.fillStyle = 'rgba(13,8,32,.55)'; ctx.fillRect(0, base, W, 6);
  try {
    const basket = await svgImage(basketSvg(style), 240, 290);
    ctx.drawImage(basket, cx - 250, 620, 500, 604);
  } catch { /* art is best-effort */ }
  if (kind === 'invite') {
    const chip = count > 0 ? `🔒 사탕 ${count}개` : '🔒 아직 비어 있어요';
    ctx.font = DISPLAY(48); const cw = ctx.measureText(chip).width + 90;
    roundRect(ctx, cx - cw / 2 - 6, 1142, cw + 12, 104, 52); ctx.fillStyle = '#2B7BE4'; ctx.fill();
    roundRect(ctx, cx - cw / 2, 1148, cw, 92, 46); ctx.fillStyle = '#FFC93C'; ctx.fill();
    ctx.fillStyle = '#3A2E3A'; ctx.fillText(chip, cx, 1211);
  }

  // message
  ctx.fillStyle = '#FFF3E6'; ctx.font = BODY(700, 50);
  if (kind === 'result') {
    ctx.fillText('할로윈이 끝나고', cx, 1400);
    ctx.fillText('바구니를 열었어요 🎃', cx, 1470);
  } else {
    ctx.fillText('익명으로 쪽지를 넣으면', cx, 1400);
    ctx.fillText('할로윈이 끝나는 순간 열어봐요', cx, 1470);
    ctx.fillStyle = '#FFC93C'; ctx.font = BODY(700, 36);
    ctx.fillText(`10월 31일 자정까지 · ${openText || '11월 1일 0시'} 오픈`, cx, 1540);
  }

  // link sticker spot / call to action
  ctx.setLineDash([16, 12]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,243,230,.6)';
  roundRect(ctx, 250, 1620, W - 500, 116, 58); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,243,230,.85)'; ctx.font = BODY(700, 34);
  ctx.fillText(kind === 'result' ? '나도 바구니 만들기' : '여기에 링크 스티커 붙이기', cx, 1690);
  ctx.fillStyle = 'rgba(255,243,230,.5)'; ctx.font = BODY(500, 28);
  ctx.fillText(url.replace(/^https?:\/\//, '').replace(/\/b\/.*$/, ''), cx, 1840);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; } catch { return 'cancel'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
