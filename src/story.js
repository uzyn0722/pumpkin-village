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

function title(ctx, text, x, y, size, fill = '#FF6FAE') {
  ctx.font = `900 ${size}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
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

// kind: 'invite' | 'result'
export async function makeStory({ kind, name, count, style = 1, openText, url }) {
  try { await Promise.all([document.fonts.load('900 80px "Noto Sans KR"'), document.fonts.load('60px Shrikhand'), document.fonts.load('700 40px "Noto Sans KR"')]); } catch { /* fallback fonts */ }
  const W = 1080; const H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#1E1430'; ctx.fillRect(0, 0, W, H);
  // soft starfield
  ctx.fillStyle = 'rgba(255,243,230,.55)';
  for (let i = 0; i < 70; i++) { const x = (i * 397) % W; const y = (i * 769) % H; const r = (i % 3) + 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // logo
  ctx.font = '56px Shrikhand, serif'; ctx.fillStyle = '#FFC93C'; ctx.textAlign = 'center';
  ctx.fillText('Halloween', W / 2, 200);
  title(ctx, '호박마을', W / 2, 320, 112, '#FF6FAE');

  // main card
  const cx = 120; const cy = 430; const cw = W - 240; const ch = 1060;
  ctx.save();
  ctx.translate(W / 2, cy + ch / 2); ctx.rotate(-0.025); ctx.translate(-W / 2, -(cy + ch / 2));
  roundRect(ctx, cx - 22, cy - 22, cw + 44, ch + 44, 78); ctx.fillStyle = '#FF5FA2'; ctx.fill();
  roundRect(ctx, cx - 10, cy - 10, cw + 20, ch + 20, 68); ctx.fillStyle = '#2B7BE4'; ctx.fill();
  roundRect(ctx, cx, cy, cw, ch, 60); ctx.fillStyle = '#FFF3E6'; ctx.fill();
  // checker strip
  ctx.save(); roundRect(ctx, cx, cy, cw, ch, 60); ctx.clip();
  for (let i = 0; i < cw / 40 + 1; i++) { ctx.fillStyle = i % 2 ? '#FFC93C' : '#FF5FA2'; ctx.fillRect(cx + i * 40, cy, 40, 40); ctx.fillStyle = i % 2 ? '#FF5FA2' : '#FFC93C'; ctx.fillRect(cx + i * 40, cy + 40, 40, 40); }
  ctx.restore();

  const fit = (text, max, start, weight = 900) => fitSize(ctx, text, max, start, (z) => `${weight} ${z}px "Noto Sans KR", sans-serif`);
  ctx.textAlign = 'center';
  const top = kind === 'result' ? `${name}의 사탕 바구니` : count > 0 ? `${name}의 바구니 · 벌써 사탕 ${count}개` : `${name}의 사탕 바구니`;
  ctx.fillStyle = '#7A6B7F'; ctx.font = `700 ${fit(top, cw - 140, 46, 700)}px "Noto Sans KR", sans-serif`; ctx.fillText(top, W / 2, cy + 170);
  const h1 = kind === 'result' ? '할로윈에' : '할로윈 끝나기 전에';
  const h2 = kind === 'result' ? `사탕 ${count}개 받았어!` : '사탕 넣어줘 🍬';
  title(ctx, h1, W / 2, cy + 272, fit(h1, cw - 120, 88), '#3A2E3A');
  title(ctx, h2, W / 2, cy + 392, fit(h2, cw - 100, 112), '#FF4F9A');

  try {
    const basket = await svgImage(basketSvg(style), 240, 290);
    ctx.drawImage(basket, W / 2 - 170, cy + 420, 340, 411);
  } catch { /* art is best-effort */ }

  const sub = kind === 'result' ? '11월 1일 0시, 다 같이 열었어요 🎃' : '익명 쪽지 OK · 고백도 OK 👻';
  ctx.fillStyle = '#3A2E3A'; ctx.font = `700 ${fit(sub, cw - 120, 44, 700)}px "Noto Sans KR", sans-serif`; ctx.fillText(sub, W / 2, cy + 890);
  const pill = kind === 'result' ? '너도 호박마을에서 바구니 만들어봐' : `⏰ ${openText || '11월 1일 0시'} 마감 · 그때 다 같이 열어요`;
  const ps = fit(pill, cw - 160, 36);
  ctx.font = `900 ${ps}px "Noto Sans KR", sans-serif`;
  const pw = ctx.measureText(pill).width + 80;
  roundRect(ctx, W / 2 - pw / 2, cy + 925, pw, 84, 42); ctx.fillStyle = '#FFC93C'; ctx.fill();
  ctx.fillStyle = '#3A2E3A'; ctx.fillText(pill, W / 2, cy + 980);
  ctx.restore();

  // sticker collage around the card
  try {
    const deco = await svgImage(
      use('gk2', 830, 330, 190, 216, 12) + use('gk1', 40, 1420, 170, 193, -10) + use('ck3', 70, 360, 150, 130, -16)
      + use('ck2', 880, 1440, 150, 130, 14) + use('ck4', 900, 1080, 120, 104, 8) + use('ck1', 20, 900, 140, 121, -8)
      + use('flw', 930, 640, 110, 110) + use('flw', 40, 1150, 80, 80)
      + use('hrt', 240, 140, 44, 40) + use('hrt', 820, 160, 34, 31) + use('hrt', 980, 920, 40, 36) + use('hrt', 60, 760, 36, 32)
      + use('spk', 150, 270, 46, 46) + use('spk', 960, 560, 40, 40) + use('spk', 230, 1600, 44, 44),
      W, H,
    );
    ctx.drawImage(deco, 0, 0, W, H);
  } catch { /* art is best-effort */ }

  // link sticker hint + domain
  if (kind === 'invite') {
    ctx.setLineDash([16, 12]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,243,230,.7)';
    roundRect(ctx, 260, 1600, W - 520, 120, 60); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#FFF3E6'; ctx.font = '700 36px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('여기에 링크 스티커 붙이기', W / 2, 1673);
  }
  ctx.fillStyle = 'rgba(255,243,230,.6)'; ctx.font = '500 30px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(url.replace(/^https?:\/\//, '').replace(/\/b\/.*$/, ''), W / 2, 1830);

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
