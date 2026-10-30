import { useEffect, useState } from 'react';

const ADJ = ['졸린', '수줍은', '말랑한', '까칠한', '느긋한', '다정한', '엉뚱한', '조용한', '반짝', '배고픈', '심드렁', '새침한', '용감한', '수상한'];
const NOUN = ['유령', '박쥐', '호박', '사탕', '부엉이', '고양이', '마녀', '달빛', '촛불', '해골', '거미', '젤리'];

export function randomNick() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a} ${n}`;
}

function lsGet(k, d) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export function deviceId() {
  let id = lsGet('pv_id', null);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    lsSet('pv_id', id);
  }
  return id;
}

export function getMe() { return lsGet('pv_me', null); }
export function saveMe(me) { lsSet('pv_me', me); }
export function ensureMe() {
  let me = getMe();
  if (!me) { me = { nick: randomNick(), ghost: 1 + Math.floor(Math.random() * 4), picked: true }; saveMe(me); }
  return me;
}

export function ownedKeys() { return lsGet('pv_owned', {}); }
export function saveOwned(slug, key, name) {
  const o = ownedKeys(); o[slug] = { key, name }; lsSet('pv_owned', o);
}
export function ownerKey(slug) { const o = ownedKeys()[slug]; return o ? o.key : null; }

export function setRef(slug) { lsSet('pv_ref', slug); }
export function getRef() { return lsGet('pv_ref', null); }

export function neighbors() { return lsGet('pv_neighbors', []); }
export function addNeighbor(slug, name) {
  const list = neighbors().filter((n) => n.slug !== slug);
  list.unshift({ slug, name });
  lsSet('pv_neighbors', list.slice(0, 20));
}

export function outline(r, color) {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    out.push(`${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${color}`);
  }
  return out.join(',');
}
export const STICKER_SHADOW = `${outline(3, '#FFC93C')},${outline(6.5, '#2B7BE4')}`;

const ERR = {
  bad_words: '나쁜 말이 들어 있어서 넣을 수 없어요',
  too_fast: '사탕이 너무 빨리 들어오고 있어요. 잠시 뒤 다시 해주세요',
  already_open: '이미 열린 바구니라 사탕을 넣을 수 없어요',
  not_found: '없는 바구니예요',
  bad_message: '쪽지는 1~200자로 써주세요',
  bad_sender: '닉네임은 1~12자로 써주세요',
  bad_name: '이름은 1~12자로 써주세요',
  locked: '아직 열 수 있는 시간이 아니에요',
  not_owner: '바구니 주인만 할 수 있어요',
  need_refs: '아직 친구 3명이 바구니를 만들지 않았어요',
  no_candy: '그 사탕은 아직 없어요',
};
export function errMsg(e) {
  const m = (e && (e.message || e.details || '')) || '';
  const k = Object.keys(ERR).find((key) => m.includes(key));
  return k ? ERR[k] : '잠시 문제가 생겼어요. 다시 해주세요';
}

export function useServerClock(serverNowIso) {
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (serverNowIso) setOffset(new Date(serverNowIso).getTime() - Date.now());
  }, [serverNowIso]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now + offset;
}

export function fmtLeft(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return d > 0 ? `${d}일 ${h}:${m}:${sec}` : `${h}:${m}:${sec}`;
}

export function openLabel(iso) {
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  const mo = k.getUTCMonth() + 1; const da = k.getUTCDate(); const h = k.getUTCHours(); const mi = k.getUTCMinutes();
  return `${mo}월 ${da}일 ${h === 0 && mi === 0 ? '0시' : `${h}시${mi ? ` ${mi}분` : ''}`}`;
}

export function hashNum(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

export const CANDY_NAMES = { 1: '줄무늬', 2: '막대사탕', 3: '하트', 4: '캔디콘' };
