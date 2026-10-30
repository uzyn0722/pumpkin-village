import { useState } from 'react';
import { Ghost } from './art.jsx';
import { STICKER_SHADOW, randomNick, hashNum } from './lib.js';

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}

export function StickerTitle({ children, size = 34, as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`sticker-title ${className}`} style={{ fontSize: size, textShadow: STICKER_SHADOW }}>
      {children}
    </Tag>
  );
}

export function NameTag({ name, me, badge }) {
  return (
    <span className="name-tag">
      {me && <span className="name-tag-me">나</span>}
      <span className="nowrap">{name}</span>
      {badge && <span className="name-tag-badge">{badge}</span>}
    </span>
  );
}

export function LivePill({ count, label }) {
  return (
    <span className="pill live-pill"><span className="dot" />{label || `${count}명 같이 보는 중`}</span>
  );
}

const SPOTS = [
  [16, 14], [80, 10], [82, 50], [14, 56], [70, 76], [24, 82], [48, 4], [80, 32], [16, 36], [56, 48], [84, 82], [34, 62],
];

export function GhostCrowd({ peers, myKey, floats, max = 10, size = 54 }) {
  const shown = [...peers].sort((a, b) => (a.key === myKey ? -1 : b.key === myKey ? 1 : 0)).slice(0, max);
  return (
    <div className="crowd" aria-label={`지금 ${peers.length}명이 같이 있어요`}>
      {shown.map((p, i) => {
        const spot = p.key === myKey ? [44, 78] : SPOTS[(hashNum(p.key, SPOTS.length) + i) % SPOTS.length];
        const f = floats[p.key];
        return (
          <div key={p.key} className="crowd-ghost" style={{ left: `${spot[0]}%`, top: `${spot[1]}%`, animationDelay: `${(i % 5) * 0.4}s` }}>
            {f && <span key={f.id} className="float-emoji">{f.emoji}</span>}
            <Ghost v={p.ghost || 1} size={p.key === myKey ? size + 6 : size} />
            <NameTag name={p.nick || '유령'} me={p.key === myKey} />
          </div>
        );
      })}
      {peers.length > max && <span className="pill crowd-more">+{peers.length - max}명</span>}
    </div>
  );
}

export const EMOJIS = [
  { e: '👋', label: '손 흔들기', text: '손 흔들어 인사했어요' },
  { e: '🧡', label: '하트', text: '하트를 보냈어요' },
  { e: '🍬', label: '사탕', text: '사탕을 흔들었어요' },
  { e: '👻', label: '깜짝', text: '깜짝 놀래켰어요' },
];

export function EmojiBar({ onSend }) {
  return (
    <div className="emoji-bar">
      {EMOJIS.map((x) => (
        <button key={x.e} type="button" className="emoji-btn" aria-label={x.label} onClick={() => onSend(x)}>{x.e}</button>
      ))}
    </div>
  );
}

export function GhostPicker({ me, onSave, onClose }) {
  const [ghost, setGhost] = useState(me.ghost || 1);
  const [nick, setNick] = useState(me.nick);
  return (
    <div className="sheet-back" role="dialog" aria-modal="true" aria-label="내 유령 고르기">
      <div className="sheet">
        <StickerTitle size={26} as="h2">내 유령 고르기</StickerTitle>
        <p className="muted center">마을에서 다른 사람들한테 이 모습으로 보여요</p>
        <div className="pick-row">
          {[1, 2, 3, 4].map((v) => (
            <button key={v} type="button" className={`pick ${ghost === v ? 'on' : ''}`} onClick={() => setGhost(v)} aria-label={`유령 ${v}`}>
              <Ghost v={v} size={56} />
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="my-nick">내 닉네임</label>
        <div className="nick-row">
          <input id="my-nick" className="input" value={nick} maxLength={12} onChange={(e) => setNick(e.target.value)} placeholder="닉네임" />
          <button type="button" className="btn-ghost small" onClick={() => setNick(randomNick())} aria-label="랜덤 닉네임">🎲 랜덤</button>
        </div>
        <p className="hint">랜덤 이름 그대로 써도 되고, 내 이름으로 바꿔도 돼요</p>
        <button type="button" className="btn-main" disabled={!nick.trim()} onClick={() => onSave({ ghost, nick: nick.trim().slice(0, 12), picked: true })}>이 유령으로 할래요</button>
        {onClose && <button type="button" className="btn-text" onClick={onClose}>닫기</button>}
      </div>
    </div>
  );
}
