import { SPRITES } from './sprites.js';

function spriteImage(id, w, h) {
  const defs = SPRITES.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}<use href="#${id}" xlink:href="#${id}" width="${w}" height="${h}"/></svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function stickerText(ctx, text, x, y, size) {
  ctx.font = `${size}px "Black Han Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2B7BE4'; ctx.lineWidth = size * 0.36; ctx.strokeText(text, x, y);
  ctx.strokeStyle = '#FFC93C'; ctx.lineWidth = size * 0.18; ctx.strokeText(text, x, y);
  ctx.fillStyle = '#FF5FA2'; ctx.fillText(text, x, y);
}

// kind: 'invite' | 'result'
export async function makeStory({ kind, name, count, style = 1, openText, url }) {
  try { await document.fonts.load('80px "Black Han Sans"'); } catch { /* fallback font */ }
  const W = 1080; const H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1E1430'; ctx.fillRect(0, 0, W, H);
  const cols = ['#FF4B3E', '#FF8A2E', '#FFC93C', '#3FBF6A', '#2B7BE4'];
  cols.forEach((col, i) => {
    ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = 54;
    ctx.arc(W / 2, 1500, 640 - i * 54, Math.PI, 0); ctx.stroke();
  });
  ctx.font = '64px Shrikhand, serif'; ctx.fillStyle = '#FFC93C'; ctx.textAlign = 'center';
  ctx.fillText('Halloween', W / 2, 260);
  stickerText(ctx, '호박마을', W / 2, 400, 150);
  try {
    const pk = await spriteImage(`pk${style}`, 188, 158);
    ctx.drawImage(pk, W / 2 - 330, 820, 660, 555);
    const gh = await spriteImage('gk2', 148, 168);
    ctx.drawImage(gh, 790, 700, 200, 227);
    const cd = await spriteImage('ck3', 148, 128);
    ctx.drawImage(cd, 110, 760, 190, 164);
  } catch { /* image draw is best-effort */ }
  ctx.fillStyle = '#FFF3E6'; ctx.font = '700 64px "Noto Sans KR", sans-serif';
  if (kind === 'result') {
    ctx.fillText(`${name}는 할로윈에`, W / 2, 560);
    stickerText(ctx, `사탕 ${count}개`, W / 2, 710, 130);
    ctx.font = '700 56px "Noto Sans KR", sans-serif'; ctx.fillStyle = '#FFF3E6';
    ctx.fillText('받았어요!', W / 2, 1520);
  } else {
    ctx.fillText(`${name}의 바구니에`, W / 2, 560);
    stickerText(ctx, '사탕 넣어줘!', W / 2, 700, 120);
    ctx.font = '700 48px "Noto Sans KR", sans-serif'; ctx.fillStyle = '#FFF3E6';
    ctx.fillText(`지금 사탕 ${count}개 · ${openText}에 열려요`, W / 2, 1520);
  }
  ctx.fillStyle = '#FFC93C'; ctx.fillRect(140, 1640, W - 280, 110);
  ctx.fillStyle = '#3A2E3A'; ctx.font = '700 40px "Noto Sans KR", sans-serif';
  ctx.fillText(url.replace(/^https?:\/\//, ''), W / 2, 1708);
  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; } catch { /* user cancelled */ return 'cancel'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
