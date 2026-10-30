import { useState } from 'react';
import { Ghost, Pumpkin, Candy } from './art.jsx';
import { randomNick, hashNum } from './lib.js';

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}

export function StickerTitle({ children, size = 34, as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`sticker-title ${className}`} style={{ fontSize: size }}>
      <span className="st-back" aria-hidden="true">{children}</span>
      <span className="st-front">{children}</span>
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

export function HowButton({ onClick, label = '호박마을이 뭐예요?' }) {
  return <button type="button" className="how-btn" onClick={onClick}>❓ {label}</button>;
}

export function HowSheet({ onClose }) {
  const steps = [
    { art: <Pumpkin v={1} size={70} />, t: '내 사탕 바구니를 만들어요', d: '링크를 친구들한테 보내요' },
    { art: <Candy t={3} size={64} />, t: '친구들이 사탕을 넣어줘요', d: '사탕 하나하나가 비밀 쪽지예요. 이름 대신 유령 이름으로도 보낼 수 있어요' },
    { art: <Ghost v={2} size={56} />, t: '할로윈이 끝나는 순간 열어봐요', d: '11월 1일 0시, 마을의 모든 바구니가 한꺼번에 열려요. 그 전엔 나도 못 봐요!' },
  ];
  return (
    <div className="sheet-back" role="dialog" aria-modal="true" aria-label="호박마을 사용법" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <StickerTitle size={26} as="h2">호박마을 이렇게 놀아요</StickerTitle>
        <ol className="how-steps">
          {steps.map((s, i) => (
            <li key={s.t}>
              <span className="how-art">{s.art}</span>
              <span className="how-text"><b><span className="how-n">{i + 1}</span>{s.t}</b><span>{s.d}</span></span>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-main" onClick={onClose}>알겠어요!</button>
      </div>
    </div>
  );
}

export function GhostPicker({ me, onSave, onClose }) {
  const [ghost, setGhost] = useState(me.ghost || 1);
  const [nick, setNick] = useState(me.nick);
  return (
    <div className="sheet-back" role="dialog" aria-modal="true" aria-label="내 유령 고르기">
      <div className="sheet">
        <StickerTitle size={26} as="h2">내 유령 바꾸기</StickerTitle>
        <p className="muted center">마을에서 이 모습으로 보이고, 유령 이름으로 사탕을 보낼 때 이 이름이 쓰여요</p>
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
